import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHash } from 'node:crypto';
import type { Platform, UpdateChannel } from '@housingcom/contracts';
import { DomainEvent, type OtaUpdatePublishedEvent } from '../../../core/events/domain-events.js';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../core/storage/object-storage.interface.js';
import { mimeForExtension } from '../../../core/utils/mime.util.js';
import type { OtaAssetRecord } from '../domain/ota.types.js';
import type { OtaUpdate } from '../entities/ota-update.entity.js';
import {
  OTA_UPDATES_REPOSITORY,
  type CreateOtaUpdateData,
  type OtaUpdatesRepository,
} from '../interfaces/ota-updates-repository.interface.js';
import { OtaBundleParserService } from './ota-bundle-parser.service.js';

export interface PublishOptions {
  channel: UpdateChannel;
  rolloutPercent: number;
  isCritical: boolean;
  message: string | null;
  publishedBy: string | null;
}

export const OTA_ASSET_PREFIX = 'ota/assets';

@Injectable()
export class OtaPublishService {
  private readonly logger = new Logger(OtaPublishService.name);

  constructor(
    @Inject(OTA_UPDATES_REPOSITORY) private readonly updates: OtaUpdatesRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    private readonly parser: OtaBundleParserService,
    private readonly events: EventEmitter2,
  ) {}

  /** Stores the bundle's assets (content-addressed, deduplicated) and creates one update per platform. */
  async publish(zip: Buffer, options: PublishOptions): Promise<OtaUpdate[]> {
    const parsed = this.parser.parse(zip);

    const rows: CreateOtaUpdateData[] = [];
    for (const p of parsed.platforms) {
      const launchAsset = await this.storeAsset(p.bundle, 'bundle', 'application/javascript');
      const assets = await this.storeUniqueAssets(p.assets);
      rows.push({
        platform: p.platform,
        runtimeVersion: p.runtimeVersion,
        channel: options.channel,
        rolloutPercent: options.rolloutPercent,
        isCritical: options.isCritical,
        message: options.message,
        gitCommit: parsed.gitCommit ?? null,
        manifest: { launchAsset, assets },
        expoConfig: parsed.expoConfig,
        publishedBy: options.publishedBy,
      });
    }

    const created = await this.updates.createMany(rows);

    this.events.emit(DomainEvent.OtaUpdatePublished, {
      updateIds: created.map((u) => u.id),
      channel: options.channel,
      runtimeVersions: Object.fromEntries(
        created.map((u) => [u.platform, u.runtimeVersion]),
      ) as Partial<Record<Platform, string>>,
      rolloutPercent: options.rolloutPercent,
    } satisfies OtaUpdatePublishedEvent);

    this.logger.log(
      { ids: created.map((u) => u.id), channel: options.channel },
      'OTA update published',
    );
    return created;
  }

  private async storeUniqueAssets(
    assets: { file: Buffer; ext: string }[],
  ): Promise<OtaAssetRecord[]> {
    const byHash = new Map<string, OtaAssetRecord>();
    for (const asset of assets) {
      const record = await this.storeAsset(asset.file, asset.ext, mimeForExtension(asset.ext));
      byHash.set(record.hash, record);
    }
    return [...byHash.values()];
  }

  private async storeAsset(
    file: Buffer,
    ext: string,
    contentType: string,
  ): Promise<OtaAssetRecord> {
    const sha256 = createHash('sha256').update(file).digest();
    const fileExtension = `.${ext.replace(/^\./, '')}`;
    const storageKey = `${OTA_ASSET_PREFIX}/${sha256.toString('hex')}${fileExtension}`;

    if (!(await this.storage.exists(storageKey))) {
      await this.storage.put(storageKey, file, contentType);
    }

    return {
      hash: sha256.toString('base64url'),
      key: createHash('md5').update(file).digest('hex'),
      contentType,
      fileExtension,
      storageKey,
    };
  }
}
