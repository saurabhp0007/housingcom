import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FeatureSource, PaymentPurpose } from '@housingcom/contracts';
import {
  EngagementEvent,
  ListingEvent,
  PaymentEvent,
  type FeaturedImpressionsEvent,
  type LeadCreatedEvent,
  type ListingViewedEvent,
  type PaymentSucceededEvent,
} from '../../../core/events/domain-events.js';
import { ListingFeaturesService } from '../services/listing-features.service.js';

interface FeaturePurchase {
  listingId: string;
  durationDays: number;
  planName: string;
}

@Injectable()
export class FeaturedEventsListener {
  private readonly logger = new Logger(FeaturedEventsListener.name);

  constructor(private readonly features: ListingFeaturesService) {}

  /** Synchronous (no `async` option): the app's verify call returns after the listing is featured. */
  @OnEvent(PaymentEvent.Succeeded)
  async onPaid(e: PaymentSucceededEvent): Promise<void> {
    if (e.purpose !== PaymentPurpose.FeatureListing) return;
    const m = e.metadata as unknown as FeaturePurchase;
    try {
      await this.features.activate({
        listingId: m.listingId,
        durationDays: m.durationDays,
        source: FeatureSource.Purchase,
        planName: m.planName,
      });
    } catch (err) {
      // Money is in; this must be fixed by hand rather than lost silently.
      this.logger.error(
        { err, paymentId: e.paymentId },
        'PAID BUT NOT FEATURED: activation failed',
      );
    }
  }

  // Performance counters for featured periods (PRD: impressions, views and leads).
  @OnEvent(ListingEvent.FeaturedImpressions, { async: true })
  async onImpressions(e: FeaturedImpressionsEvent): Promise<void> {
    await this.features
      .recordImpressions(e.listingIds)
      .catch((err) => this.logger.warn({ err }, 'Impressions not recorded'));
  }

  @OnEvent(ListingEvent.Viewed, { async: true })
  async onViewed(e: ListingViewedEvent): Promise<void> {
    await this.features
      .recordView(e.listingId)
      .catch((err) => this.logger.warn({ err }, 'View not recorded'));
  }

  @OnEvent(EngagementEvent.LeadCreated, { async: true })
  async onLead(e: LeadCreatedEvent): Promise<void> {
    await this.features
      .recordLead(e.listingId)
      .catch((err) => this.logger.warn({ err }, 'Lead not recorded'));
  }
}
