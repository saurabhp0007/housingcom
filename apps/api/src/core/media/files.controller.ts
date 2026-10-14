import { Controller, Get, Header, Inject, Param, StreamableFile } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Matches } from 'class-validator';
import { AppException } from '../errors/app.exception.js';
import { Public, RawResponse } from '../http/decorators/index.js';
import { OBJECT_STORAGE, type ObjectStorage } from '../storage/object-storage.interface.js';
import { mimeForExtension } from '../utils/mime.util.js';

class ListingFileParams {
  @Matches(/^[0-9a-f-]{36}$/)
  listingId: string;

  @Matches(/^[0-9a-f-]{36}(_thumb)?\.(webp|mp4|mov)$/)
  file: string;
}

class BannerFileParams {
  @Matches(/^[0-9a-f-]{36}\.webp$/)
  file: string;
}

/**
 * Serves public listing media and banners when no CDN is configured. Only the `listings/` and
 * `banners/` prefixes are reachable, and names are validated, so private files (verification documents) can never leak.
 */
@ApiExcludeController()
@Public()
@SkipThrottle()
@RawResponse()
@Controller('files')
export class FilesController {
  constructor(@Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage) {}

  @Get('listings/:listingId/:file')
  @Header('cache-control', 'public, max-age=31536000, immutable')
  async listingFile(@Param() { listingId, file }: ListingFileParams): Promise<StreamableFile> {
    const object = await this.storage.get(`listings/${listingId}/${file}`);
    if (!object) throw AppException.notFound('File');
    return new StreamableFile(object.body, {
      type: mimeForExtension(file.slice(file.lastIndexOf('.') + 1)),
      length: object.size,
    });
  }

  @Get('banners/:file')
  @Header('cache-control', 'public, max-age=31536000, immutable')
  async bannerFile(@Param() { file }: BannerFileParams): Promise<StreamableFile> {
    const object = await this.storage.get(`banners/${file}`);
    if (!object) throw AppException.notFound('File');
    return new StreamableFile(object.body, { type: 'image/webp', length: object.size });
  }
}
