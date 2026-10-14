import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ListingEventType,
  ListingStatus,
  UserRole,
  type ListingDetailResponse,
} from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { AppException } from '../../../core/errors/app.exception.js';
import { ListingEvent, type ListingViewedEvent } from '../../../core/events/domain-events.js';
import { RecommendationsService } from '../../recommendations/services/recommendations.service.js';
import { ListingDetailsService } from './listing-details.service.js';

/** Public, read-only access to live listings (guests included). */
@Injectable()
export class ListingsQueryService {
  constructor(
    private readonly details: ListingDetailsService,
    private readonly recommendations: RecommendationsService,
    private readonly events: EventEmitter2,
  ) {}

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

  /** Share taps count as interest for the sharer's recommendations. */
  async trackShare(id: string, viewer?: AuthUser): Promise<void> {
    const row = await this.details.loadRow(id);
    if (row.listing.status !== ListingStatus.Live) throw AppException.notFound('Listing');
    if (viewer) await this.recommendations.track(viewer.id, id, ListingEventType.Share);
  }
}
