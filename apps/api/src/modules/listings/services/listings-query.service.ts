import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ListingStatus,
  UserRole,
  type ListingCardResponse,
  type ListingDetailResponse,
  type Paginated,
} from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { AppException } from '../../../core/errors/app.exception.js';
import { ListingEvent, type ListingViewedEvent } from '../../../core/events/domain-events.js';
import type { BrowseListingsQueryDto } from '../dto/listing-query.dto.js';
import {
  LISTINGS_REPOSITORY,
  type ListingsRepository,
} from '../interfaces/listings-repository.interface.js';
import { ListingMapper } from '../mappers/listing.mapper.js';
import { ListingDetailsService } from './listing-details.service.js';

/** Public, read-only access to live listings (guests included). */
@Injectable()
export class ListingsQueryService {
  constructor(
    @Inject(LISTINGS_REPOSITORY) private readonly listings: ListingsRepository,
    private readonly details: ListingDetailsService,
    private readonly mapper: ListingMapper,
    private readonly events: EventEmitter2,
  ) {}

  async browse(q: BrowseListingsQueryDto): Promise<Paginated<ListingCardResponse>> {
    const page = await this.listings.browseLive({
      point: q.lat !== undefined && q.lng !== undefined ? { lat: q.lat, lng: q.lng } : undefined,
      radiusKm: q.radiusKm,
      cityId: q.cityId,
      areaId: q.areaId,
      type: q.type,
      sort: q.sort,
      page: q.page,
      limit: q.limit,
    });
    return { items: page.items.map((r) => this.mapper.card(r)), meta: page.meta };
  }

  /** Live listings for everyone; other statuses only for the owner and admins (404 otherwise). */
  async detail(id: string, viewer?: AuthUser): Promise<ListingDetailResponse> {
    const row = await this.details.loadRow(id);
    const isOwner = viewer?.id === row.listing.ownerId;
    const privileged = isOwner || !!viewer?.roles.includes(UserRole.Admin);
    if (row.listing.status !== ListingStatus.Live && !privileged)
      throw AppException.notFound('Listing');

    if (!isOwner && row.listing.status === ListingStatus.Live) {
      this.events.emit(ListingEvent.Viewed, {
        listingId: id,
        viewerId: viewer?.id ?? null,
      } satisfies ListingViewedEvent);
    }
    return this.details.build(row, privileged);
  }
}
