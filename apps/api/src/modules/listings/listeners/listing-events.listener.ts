import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ListingEventType, ListingStatus } from '@housingcom/contracts';
import {
  ListingEvent,
  type ListingLocationChangedEvent,
  type ListingStatusEvent,
  type ListingViewedEvent,
} from '../../../core/events/domain-events.js';
import { RecommendationsService } from '../../recommendations/services/recommendations.service.js';
import {
  LISTINGS_REPOSITORY,
  type ListingsRepository,
} from '../interfaces/listings-repository.interface.js';
import { ListingEnrichmentService } from '../services/listing-enrichment.service.js';

/**
 * Side effects of listing events, off the request path:
 * view counting, activity tracking for recommendations, and nearby-places enrichment.
 * Phase 4 adds push notifications to the lister on approve/reject from these same events.
 */
@Injectable()
export class ListingEventsListener {
  private readonly logger = new Logger(ListingEventsListener.name);

  constructor(
    @Inject(LISTINGS_REPOSITORY) private readonly listings: ListingsRepository,
    private readonly recommendations: RecommendationsService,
    private readonly enrichment: ListingEnrichmentService,
  ) {}

  @OnEvent(ListingEvent.Viewed, { async: true })
  async onViewed(event: ListingViewedEvent): Promise<void> {
    await Promise.all([
      this.listings.incrementViews(event.listingId),
      // Signed-in views feed personal recommendations.
      event.viewerId
        ? this.recommendations.track(event.viewerId, event.listingId, ListingEventType.View)
        : null,
    ]).catch((err) => this.logger.warn({ err }, 'View tracking failed'));
  }

  @OnEvent(ListingEvent.StatusChanged, { async: true })
  async onStatusChanged(event: ListingStatusEvent): Promise<void> {
    this.logger.log({ event: ListingEvent.StatusChanged, ...event }, 'Listing status changed');
    if (event.to === ListingStatus.Live) await this.schedule(event.listingId);
  }

  @OnEvent(ListingEvent.LocationChanged, { async: true })
  async onLocationChanged(event: ListingLocationChangedEvent): Promise<void> {
    await this.schedule(event.listingId);
  }

  private async schedule(listingId: string): Promise<void> {
    await this.enrichment
      .schedule(listingId)
      .catch((err) => this.logger.warn({ err }, 'Enrichment scheduling failed'));
  }
}
