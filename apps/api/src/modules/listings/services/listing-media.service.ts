import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LISTING_LIMITS, MediaKind, type ListingMediaResponse } from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import { ImageProcessingService } from '../../../core/media/image-processing.service.js';
import { OBJECT_STORAGE, type ObjectStorage } from '../../../core/storage/object-storage.interface.js';
import {
  LISTING_MEDIA_REPOSITORY,
  type ListingMediaRepository,
} from '../interfaces/listing-media-repository.interface.js';
import { ListingMapper } from '../mappers/listing.mapper.js';
import { ListingsService } from './listings.service.js';

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const VIDEO_TYPES: Record<string, string> = { 'video/mp4': 'mp4', 'video/quicktime': 'mov' };

/** True for ISO-BMFF containers (MP4 / MOV): bytes 4..8 are "ftyp". */
const looksLikeMp4 = (buf: Buffer) => buf.length > 12 && buf.toString('ascii', 4, 8) === 'ftyp';

/** Photo/video gallery of a listing: upload (processed + stored), remove, reorder. */
@Injectable()
export class ListingMediaService {
  private readonly logger = new Logger(ListingMediaService.name);

  constructor(
    @Inject(LISTING_MEDIA_REPOSITORY) private readonly media: ListingMediaRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    private readonly listings: ListingsService,
    private readonly images: ImageProcessingService,
    private readonly mapper: ListingMapper,
  ) {}

  async upload(userId: string, listingId: string, file: UploadedFile): Promise<ListingMediaResponse> {
    const listing = await this.listings.assertOwned(userId, listingId);
    const kind = this.kindOf(file);
    await this.assertWithinLimits(listingId, kind, file.size);

    const id = randomUUID();
    const base = `listings/${listingId}/${id}`;
    let created;
    if (kind === MediaKind.Image) {
      const processed = await this.images.listingPhoto(file.buffer);
      await Promise.all([
        this.storage.put(`${base}.webp`, processed.main, 'image/webp'),
        this.storage.put(`${base}_thumb.webp`, processed.thumbnail, 'image/webp'),
      ]);
      created = await this.media.add({
        listingId,
        kind,
        storageKey: `${base}.webp`,
        thumbnailKey: `${base}_thumb.webp`,
        width: processed.width,
        height: processed.height,
        sizeBytes: processed.main.length,
      });
    } else {
      if (!looksLikeMp4(file.buffer)) throw this.invalid('That file is not a valid MP4/MOV video');
      const key = `${base}.${VIDEO_TYPES[file.mimetype]}`;
      await this.storage.put(key, file.buffer, file.mimetype);
      created = await this.media.add({
        listingId,
        kind,
        storageKey: key,
        thumbnailKey: null,
        width: null,
        height: null,
        sizeBytes: file.size,
      });
    }

    await this.listings.applyEdit(listing, userId);
    return this.mapper.media(created);
  }

  async remove(userId: string, listingId: string, mediaId: string): Promise<void> {
    const listing = await this.listings.assertOwned(userId, listingId);
    const item = await this.media.findOne(listingId, mediaId);
    if (!item) throw AppException.notFound('Photo');

    await this.media.remove(mediaId);
    await this.listings.applyEdit(listing, userId);
    // Storage cleanup is best-effort; an orphaned object is harmless.
    for (const key of [item.storageKey, item.thumbnailKey]) {
      if (key) await this.storage.delete(key).catch((err) => this.logger.warn({ err, key }, 'Media delete failed'));
    }
  }

  async reorder(userId: string, listingId: string, mediaIds: string[]): Promise<ListingMediaResponse[]> {
    await this.listings.assertOwned(userId, listingId);
    const existing = await this.media.list(listingId);
    const sameSet =
      existing.length === mediaIds.length &&
      new Set(mediaIds).size === mediaIds.length &&
      existing.every((m) => mediaIds.includes(m.id));
    if (!sameSet) throw this.invalid('The new order must list every photo exactly once');

    await this.media.reorder(listingId, mediaIds);
    return (await this.media.list(listingId)).map((m) => this.mapper.media(m));
  }

  private kindOf(file: UploadedFile): MediaKind {
    if (IMAGE_TYPES.has(file.mimetype)) return MediaKind.Image;
    if (file.mimetype in VIDEO_TYPES) return MediaKind.Video;
    throw this.invalid('Upload a JPG, PNG, WebP or HEIC photo, or an MP4/MOV video');
  }

  private async assertWithinLimits(listingId: string, kind: MediaKind, size: number): Promise<void> {
    const isImage = kind === MediaKind.Image;
    const maxBytes = isImage ? LISTING_LIMITS.maxImageBytes : LISTING_LIMITS.maxVideoBytes;
    if (size > maxBytes) throw this.invalid(`File is too large (max ${Math.round(maxBytes / 1048576)} MB)`);

    const max = isImage ? LISTING_LIMITS.maxImages : LISTING_LIMITS.maxVideos;
    if ((await this.media.countByKind(listingId, kind)) >= max) {
      throw AppException.badRequest(
        ErrorCode.MediaLimitReached,
        isImage ? `You can add up to ${max} photos` : `You can add up to ${max} video`,
      );
    }
  }

  private invalid(message: string): AppException {
    return AppException.badRequest(ErrorCode.InvalidMedia, message);
  }
}
