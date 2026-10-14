import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Queue } from 'bullmq';
import {
  FeatureSource,
  FeatureStatus,
  ListingStatus,
  PaymentPurpose,
  type CheckoutResponse,
  type FeatureOptionsResponse,
  type ListingFeatureResponse,
  type Paginated,
} from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import { FeatureEvent, type FeatureLifecycleEvent } from '../../../core/events/domain-events.js';
import { QueueName } from '../../../core/queue/queue.constants.js';
import type { Listing } from '../../listings/entities/listing.entity.js';
import { ListingCatalogService } from '../../listings/services/listing-catalog.service.js';
import { PaymentsService } from '../../payments/services/payments.service.js';
import type { ListingFeature } from '../entities/listing-feature.entity.js';
import {
  FEATURED_REPOSITORY,
  type FeaturedRepository,
} from '../interfaces/featured-repository.interface.js';
import { toFeatureResponse, toPlanResponse } from '../mappers/featured.mapper.js';
import {
  EXPIRY_REMINDER_MS,
  canTransitionFeature,
  nextPeriod,
  resumedEnd,
  slotLimit,
} from '../policies/featured.policy.js';
import { FeaturedPlansService } from './featured-plans.service.js';

export const LifecycleJob = { Remind: 'remind', End: 'end' } as const;
export interface LifecycleJobData {
  featureId: string;
  /** The period end the job was scheduled for; renewals make older jobs no-ops. */
  endsAt: string;
}

export interface ActivateInput {
  listingId: string;
  durationDays: number;
  source: FeatureSource;
  planName: string | null;
  pinned?: boolean;
}

/** Featured periods: purchase, activation, admin controls, performance and expiry. */
@Injectable()
export class ListingFeaturesService {
  private readonly logger = new Logger(ListingFeaturesService.name);

  constructor(
    @Inject(FEATURED_REPOSITORY) private readonly repo: FeaturedRepository,
    @InjectQueue(QueueName.FeaturedLifecycle) private readonly queue: Queue<LifecycleJobData>,
    private readonly plans: FeaturedPlansService,
    private readonly catalog: ListingCatalogService,
    private readonly payments: PaymentsService,
    private readonly events: EventEmitter2,
  ) {}

  // ── Lister ────────────────────────────────────────────

  async options(ownerId: string, listingId: string): Promise<FeatureOptionsResponse> {
    const listing = await this.ownLiveListing(ownerId, listingId);
    const [plans, open, used, cards] = await Promise.all([
      this.plans.forListing(listing),
      this.repo.findOpen(listingId),
      listing.areaId ? this.repo.countActiveInArea(listing.areaId, listingId) : Promise.resolve(0),
      this.catalog.cards([listingId]),
    ]);
    const limit = slotLimit(plans);
    return {
      listingId,
      plans: plans.map(toPlanResponse),
      // Renewing an open period never needs a new slot.
      slots: { limit, used, available: !!open || limit === null || used < limit },
      current: open ? toFeatureResponse(open, cards.get(listingId)!) : null,
    };
  }

  async checkout(ownerId: string, listingId: string, planId: string): Promise<CheckoutResponse> {
    const options = await this.options(ownerId, listingId);
    const plan = options.plans.find((p) => p.id === planId);
    if (!plan) {
      throw AppException.badRequest(ErrorCode.PlanNotAvailable, 'This plan is not available here');
    }
    if (!options.slots.available) {
      throw AppException.conflict(
        ErrorCode.FeaturedSlotsFull,
        'All featured spots in this area are taken. Please try again later.',
      );
    }
    return this.payments.createOrder({
      userId: ownerId,
      purpose: PaymentPurpose.FeatureListing,
      referenceId: listingId,
      amountInr: plan.priceInr,
      description: `${plan.name} · featured for ${plan.durationDays} days`,
      metadata: {
        planId: plan.id,
        planName: plan.name,
        durationDays: plan.durationDays,
        listingId,
      },
    });
  }

  async mine(ownerId: string): Promise<ListingFeatureResponse[]> {
    return this.withCards(await this.repo.forOwner(ownerId));
  }

  // ── Activation ────────────────────────────────────────

  /** Starts or extends the listing's featured period. Idempotence is the caller's job (payments). */
  async activate(input: ActivateInput): Promise<ListingFeature> {
    const listing = await this.catalog.get(input.listingId);
    const now = new Date();
    const open = await this.repo.findOpen(listing.id);
    const period = nextPeriod(open, input.durationDays, now);
    let feature: ListingFeature;

    if (open) {
      const changes: Partial<ListingFeature> = {
        endsAt: period.endsAt,
        planName: input.planName ?? open.planName,
        pinned: open.pinned || !!input.pinned,
      };
      await this.repo.updateFeature(open.id, changes);
      feature = { ...open, ...changes };
    } else {
      feature = await this.repo.createFeature({
        listingId: listing.id,
        ownerId: listing.ownerId,
        areaId: listing.areaId,
        source: input.source,
        pinned: !!input.pinned,
        startsAt: period.startsAt ?? now,
        endsAt: period.endsAt,
        planName: input.planName,
      });
    }

    await this.sync(feature);
    await this.scheduleLifecycle(feature);
    this.events.emit(FeatureEvent.Activated, {
      featureId: feature.id,
      listingId: listing.id,
      ownerId: listing.ownerId,
      endsAt: feature.endsAt.toISOString(),
      renewed: !!open,
    } satisfies FeatureLifecycleEvent);
    return feature;
  }

  // ── Admin ─────────────────────────────────────────────

  async adminList(
    status: FeatureStatus,
    page: number,
    limit: number,
  ): Promise<Paginated<ListingFeatureResponse>> {
    const { items, meta } = await this.repo.page(status, page, limit);
    return { items: await this.withCards(items), meta };
  }

  /** "Manually pin a listing in an area": featured without payment. */
  async pin(
    listingId: string,
    durationDays: number,
    pinned: boolean,
  ): Promise<ListingFeatureResponse> {
    const listing = await this.catalog.get(listingId);
    if (listing.status !== ListingStatus.Live) {
      throw AppException.badRequest(
        ErrorCode.FeatureNotAllowed,
        'Only live listings can be featured',
      );
    }
    const feature = await this.activate({
      listingId,
      durationDays,
      source: FeatureSource.Admin,
      planName: pinned ? 'Pinned by admin' : 'Featured by admin',
      pinned,
    });
    return (await this.withCards([feature]))[0]!;
  }

  async pause(id: string): Promise<ListingFeatureResponse> {
    const f = await this.transition(id, 'pause');
    return this.save(f, { status: FeatureStatus.Paused, pausedAt: new Date() });
  }

  async resume(id: string): Promise<ListingFeatureResponse> {
    const f = await this.transition(id, 'resume');
    const now = new Date();
    const updated = await this.save(f, {
      status: FeatureStatus.Active,
      pausedAt: null,
      endsAt: resumedEnd(f.endsAt, f.pausedAt ?? now, now),
    });
    await this.scheduleLifecycle({ ...f, endsAt: new Date(updated.endsAt) });
    return updated;
  }

  async remove(id: string): Promise<ListingFeatureResponse> {
    const f = await this.transition(id, 'remove');
    return this.save(f, { status: FeatureStatus.Removed, pausedAt: null });
  }

  countActive(): Promise<number> {
    return this.repo.countActive();
  }

  // ── Counters & lifecycle ──────────────────────────────

  recordImpressions(listingIds: string[]): Promise<void> {
    return this.repo.increment(listingIds, 'impressions');
  }

  recordView(listingId: string): Promise<void> {
    return this.repo.increment([listingId], 'views');
  }

  recordLead(listingId: string): Promise<void> {
    return this.repo.increment([listingId], 'leads');
  }

  async runLifecycleJob(name: string, data: LifecycleJobData): Promise<void> {
    const f = await this.repo.findFeature(data.featureId);
    // Renewed, resumed with a new end, paused or removed since scheduling: nothing to do.
    if (!f || f.status !== FeatureStatus.Active || f.endsAt.toISOString() !== data.endsAt) return;
    const event: FeatureLifecycleEvent = {
      featureId: f.id,
      listingId: f.listingId,
      ownerId: f.ownerId,
      endsAt: data.endsAt,
    };
    if (name === LifecycleJob.Remind) {
      this.events.emit(FeatureEvent.Expiring, event);
      return;
    }
    await this.repo.updateFeature(f.id, { status: FeatureStatus.Expired });
    await this.catalog.setFeatured(f.listingId, null, false);
    this.events.emit(FeatureEvent.Ended, event);
  }

  // ── Internals ─────────────────────────────────────────

  private async ownLiveListing(ownerId: string, listingId: string): Promise<Listing> {
    const listing = await this.catalog.get(listingId);
    if (listing.ownerId !== ownerId) throw AppException.notFound('Listing');
    if (listing.status !== ListingStatus.Live) {
      throw AppException.badRequest(
        ErrorCode.FeatureNotAllowed,
        'Only live listings can be featured',
      );
    }
    return listing;
  }

  private async transition(
    id: string,
    action: 'pause' | 'resume' | 'remove',
  ): Promise<ListingFeature> {
    const f = await this.repo.findFeature(id);
    if (!f) throw AppException.notFound('Featured listing');
    if (!canTransitionFeature(f.status, action)) {
      throw AppException.conflict(
        ErrorCode.FeatureTransitionNotAllowed,
        `Cannot ${action} a ${f.status} listing`,
      );
    }
    return f;
  }

  private async save(
    f: ListingFeature,
    changes: Partial<ListingFeature>,
  ): Promise<ListingFeatureResponse> {
    await this.repo.updateFeature(f.id, changes);
    const updated = { ...f, ...changes };
    await this.sync(updated);
    return (await this.withCards([updated]))[0]!;
  }

  /** Mirrors the period onto the listing, which is what placement and the Featured tag read. */
  private async sync(f: ListingFeature): Promise<void> {
    const showing = f.status === FeatureStatus.Active;
    await this.catalog.setFeatured(f.listingId, showing ? f.endsAt : null, showing && f.pinned);
  }

  private async scheduleLifecycle(f: ListingFeature): Promise<void> {
    const endsAt = f.endsAt.toISOString();
    const until = f.endsAt.getTime() - Date.now();
    const opts = (name: string, delay: number) => ({
      jobId: `${name}-${f.id}-${f.endsAt.getTime()}`,
      delay: Math.max(0, delay),
      attempts: 3,
      backoff: { type: 'exponential' as const, delay: 30_000 },
      removeOnComplete: true,
      removeOnFail: 500,
    });
    try {
      if (until > EXPIRY_REMINDER_MS) {
        await this.queue.add(
          LifecycleJob.Remind,
          { featureId: f.id, endsAt },
          opts(LifecycleJob.Remind, until - EXPIRY_REMINDER_MS),
        );
      }
      await this.queue.add(
        LifecycleJob.End,
        { featureId: f.id, endsAt },
        opts(LifecycleJob.End, until),
      );
    } catch (err) {
      // Placement already stops at endsAt; jobs only add reminders and the status change.
      this.logger.warn({ err, featureId: f.id }, 'Could not schedule featured lifecycle jobs');
    }
  }

  private async withCards(features: ListingFeature[]): Promise<ListingFeatureResponse[]> {
    const cards = await this.catalog.cards(features.map((f) => f.listingId));
    return features.flatMap((f) => {
      const card = cards.get(f.listingId);
      return card ? [toFeatureResponse(f, card)] : [];
    });
  }
}
