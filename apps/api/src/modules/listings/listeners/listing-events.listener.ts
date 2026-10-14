import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ListingEvent,
  type ListingStatusEvent,
  type ListingViewedEvent,
} from '../../../core/events/domain-events.js';
import {
  LISTINGS_REPOSITORY,
  type ListingsRepository,
} from '../interfaces/listings-repository.interface.js';

/**
 * Side effects of listing events. View counting happens off the request path.
 * Phase 4 adds push notifications to the lister on approve/reject from these same events.
 */
@Injectable()
export class ListingEventsListener {
  private readonly logger = new Logger(ListingEventsListener.name);

  constructor(@Inject(LISTINGS_REPOSITORY) private readonly listings: ListingsRepository) {}

  @OnEvent(ListingEvent.Viewed, { async: true })
  async onViewed(event: ListingViewedEvent): Promise<void> {
    await this.listings
      .incrementViews(event.listingId)
      .catch((err) => this.logger.warn({ err }, 'View count failed'));
  }

  @OnEvent(ListingEvent.StatusChanged, { async: true })
  onStatusChanged(event: ListingStatusEvent): void {
    this.logger.log({ event: ListingEvent.StatusChanged, ...event }, 'Listing status changed');
  }
}
