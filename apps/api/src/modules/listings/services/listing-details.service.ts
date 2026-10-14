import { Inject, Injectable } from '@nestjs/common';
import type { ListingDetailResponse } from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { UsersService } from '../../users/services/users.service.js';
import {
  LISTING_MEDIA_REPOSITORY,
  type ListingMediaRepository,
} from '../interfaces/listing-media-repository.interface.js';
import {
  LISTINGS_REPOSITORY,
  type ListingRow,
  type ListingsRepository,
} from '../interfaces/listings-repository.interface.js';
import { ListingMapper } from '../mappers/listing.mapper.js';

/** Assembles the full listing detail (row + gallery + owner) for any audience. */
@Injectable()
export class ListingDetailsService {
  constructor(
    @Inject(LISTINGS_REPOSITORY) private readonly listings: ListingsRepository,
    @Inject(LISTING_MEDIA_REPOSITORY) private readonly media: ListingMediaRepository,
    private readonly users: UsersService,
    private readonly mapper: ListingMapper,
  ) {}

  async loadRow(id: string): Promise<ListingRow> {
    const row = await this.listings.findRow(id);
    if (!row) throw AppException.notFound('Listing');
    return row;
  }

  async build(row: ListingRow, privileged: boolean): Promise<ListingDetailResponse> {
    const [media, owner, nearby] = await Promise.all([
      this.media.list(row.listing.id),
      this.users.getById(row.listing.ownerId),
      this.listings.findNearbyPlaces(row.listing.id),
    ]);
    return this.mapper.detail(row, media, owner, nearby, privileged);
  }

  /** Owner or admin view (any status, with moderation fields). */
  async forPrivileged(id: string): Promise<ListingDetailResponse> {
    return this.build(await this.loadRow(id), true);
  }
}
