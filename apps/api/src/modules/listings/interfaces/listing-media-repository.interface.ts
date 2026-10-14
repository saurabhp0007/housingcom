import type { MediaKind } from '@housingcom/contracts';
import type { ListingMedia } from '../entities/listing-media.entity.js';

export const LISTING_MEDIA_REPOSITORY = Symbol('LISTING_MEDIA_REPOSITORY');

export interface CreateMediaData {
  listingId: string;
  kind: MediaKind;
  storageKey: string;
  thumbnailKey: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number;
}

export interface ListingMediaRepository {
  list(listingId: string): Promise<ListingMedia[]>;
  countByKind(listingId: string, kind: MediaKind): Promise<number>;
  /** Appends at the end of the gallery. */
  add(data: CreateMediaData): Promise<ListingMedia>;
  findOne(listingId: string, mediaId: string): Promise<ListingMedia | null>;
  remove(mediaId: string): Promise<void>;
  /** Positions follow the order of `mediaIds`. */
  reorder(listingId: string, mediaIds: string[]): Promise<void>;
}
