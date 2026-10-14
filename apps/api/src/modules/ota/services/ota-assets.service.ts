import { Inject, Injectable, StreamableFile } from '@nestjs/common';
import { AppException } from '../../../core/errors/app.exception.js';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../core/storage/object-storage.interface.js';
import { mimeForExtension } from '../../../core/utils/mime.util.js';
import { OTA_ASSET_PREFIX } from './ota-publish.service.js';

/** Streams OTA assets from storage. */
@Injectable()
export class OtaAssetsService {
  constructor(@Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage) {}

  async open(file: string): Promise<StreamableFile> {
    const object = await this.storage.get(`${OTA_ASSET_PREFIX}/${file}`);
    if (!object) throw AppException.notFound('Asset');
    const ext = file.slice(file.lastIndexOf('.') + 1);
    return new StreamableFile(object.body, {
      type: mimeForExtension(ext),
      length: object.size,
    });
  }
}
