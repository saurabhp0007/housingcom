import { Inject, Injectable } from '@nestjs/common';
import { ListingStatus, type ListingCardResponse } from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import type { Listing } from '../entities/listing.entity.js';
import {
  LISTINGS_REPOSITORY,
  type ListingsRepository,
} from '../interfaces/listings-repository.interface.js';
import { ListingMapper } from '../mappers/listing.mapper.js';

/**
 * The listings module's public surface for other modules (favourites, leads, chat, reviews,
 * reports, saved searches). They never touch listing tables directly.
 */
@Injectable()
export class ListingCatalogService {
  constructor(
    @Inject(LISTINGS_REPOSITORY) private readonly listings: ListingsRepository,
    private readonly mapper: ListingMapper,
  ) {}

  async get(id: string): Promise<Listing> {
    const listing = await this.listings.findById(id);
    if (!listing) throw AppException.notFound('Listing');
    return listing;
  }

  /** Only live listings can be contacted, saved, reviewed or reported. */
  async getLive(id: string): Promise<Listing> {
    const listing = await this.get(id);
    if (listing.status !== ListingStatus.Live) throw AppException.notFound('Listing');
    return listing;
  }

  /**
   * Cards for many listings in one query, keyed by id (missing / deleted ids are absent).
   * `liveOnly` also drops listings that are no longer live (rented out, removed, in review).
   */
  async cards(
    ids: string[],
    { liveOnly = false }: { liveOnly?: boolean } = {},
  ): Promise<Map<string, ListingCardResponse>> {
    const rows = await this.listings.findRowsByIds([...new Set(ids)]);
    return new Map(
      rows
        .filter((r) => !liveOnly || r.listing.status === ListingStatus.Live)
        .map((r) => [r.listing.id, this.mapper.card(r)]),
    );
  }

  incrementContacts(id: string): Promise<void> {
    return this.listings.incrementContacts(id);
  }

  setRating(id: string, average: number | null, count: number): Promise<void> {
    return this.listings.setRating(id, average, count);
  }

  /** Owned by the featured module: null hides the listing from featured placement. */
  setFeatured(id: string, until: Date | null, pinned = false): Promise<void> {
    return this.listings.setFeatured(id, until, pinned);
  }
}
