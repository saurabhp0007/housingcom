import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { appConfig } from '../../../config/configuration.js';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import type { OtaAssetRecord, OtaClientRequest } from '../domain/ota.types.js';
import type { OtaUpdate } from '../entities/ota-update.entity.js';
import {
  OTA_UPDATES_REPOSITORY,
  type OtaUpdatesRepository,
} from '../interfaces/ota-updates-repository.interface.js';
import { decideUpdate } from '../policies/ota-rollout.policy.js';
import { buildMultipartMixed, type MultipartPart } from '../utils/multipart.util.js';
import { OTA_ASSET_PREFIX } from './ota-publish.service.js';
import { OtaSigningService } from './ota-signing.service.js';

/** How many recent active updates are considered when picking one for a device. */
const CANDIDATE_WINDOW = 10;

export interface OtaManifestResponse {
  body: string;
  contentType: string;
}

/** Implements the Expo Updates protocol v1 response for GET /ota/manifest. */
@Injectable()
export class OtaManifestService {
  constructor(
    @Inject(OTA_UPDATES_REPOSITORY) private readonly updates: OtaUpdatesRepository,
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
    private readonly signing: OtaSigningService,
  ) {}

  async respond(client: OtaClientRequest): Promise<OtaManifestResponse> {
    if (client.expectSignature && !this.signing.isEnabled) {
      throw AppException.badRequest(
        ErrorCode.OtaSigningUnavailable,
        'Code signing requested but not configured',
      );
    }

    const candidates = await this.updates.findActive(
      client.platform,
      client.runtimeVersion,
      client.channel,
      CANDIDATE_WINDOW,
    );
    const decision = decideUpdate(candidates, client);

    let part: MultipartPart;
    switch (decision.kind) {
      case 'update':
        part = { name: 'manifest', body: JSON.stringify(this.buildManifest(decision.update)) };
        break;
      case 'rollBackToEmbedded':
        part = {
          name: 'directive',
          body: JSON.stringify({
            type: 'rollBackToEmbedded',
            parameters: { commitTime: new Date().toISOString() },
          }),
        };
        break;
      case 'noUpdateAvailable':
        part = { name: 'directive', body: JSON.stringify({ type: 'noUpdateAvailable' }) };
        break;
    }

    if (client.expectSignature) {
      part.headers = { 'expo-signature': this.signing.signatureHeader(part.body) };
    }

    return buildMultipartMixed([
      part,
      { name: 'extensions', body: JSON.stringify({ assetRequestHeaders: {} }) },
    ]);
  }

  private buildManifest(update: OtaUpdate) {
    return {
      id: update.id,
      createdAt: update.createdAt.toISOString(),
      runtimeVersion: update.runtimeVersion,
      launchAsset: this.toManifestAsset(update.manifest.launchAsset),
      assets: update.manifest.assets.map((a) => this.toManifestAsset(a)),
      metadata: { isCritical: String(update.isCritical) },
      extra: { expoClient: update.expoConfig },
    };
  }

  private toManifestAsset(asset: OtaAssetRecord) {
    return {
      hash: asset.hash,
      key: asset.key,
      contentType: asset.contentType,
      fileExtension: asset.fileExtension,
      url: `${this.app.publicBaseUrl}/${this.app.apiPrefix}/ota/assets/${asset.storageKey.slice(OTA_ASSET_PREFIX.length + 1)}`,
    };
  }
}
