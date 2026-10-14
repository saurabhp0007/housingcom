import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { VisitSlot, VisitStatus } from '@housingcom/contracts';
import {
  EngagementEvent,
  FeatureEvent,
  ListingEvent,
  UserAdminEvent,
  type FeatureLifecycleEvent,
  type LeadCreatedEvent,
  type ListingStatusEvent,
  type MessageSentEvent,
  type SavedSearchMatchedEvent,
  type UserModeratedEvent,
  type VisitEvent,
} from '../../../core/events/domain-events.js';
import { ListingCatalogService } from '../../listings/services/listing-catalog.service.js';
import { UsersService } from '../../users/services/users.service.js';
import { NotificationTemplates as T } from '../policies/notification-templates.js';
import { NotificationsService } from '../services/notifications.service.js';

/**
 * Turns domain events into inbox entries + pushes. Feature modules never call notifications
 * directly; adding a notification is a new handler here.
 */
@Injectable()
export class NotificationEventsListener {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly catalog: ListingCatalogService,
    private readonly users: UsersService,
  ) {}

  @OnEvent(ListingEvent.Approved, { async: true })
  async onApproved(e: ListingStatusEvent): Promise<void> {
    await this.notifications.notify(
      e.ownerId,
      T.listingApproved(e.listingId, await this.title(e.listingId)),
    );
  }

  @OnEvent(ListingEvent.Rejected, { async: true })
  async onRejected(e: ListingStatusEvent): Promise<void> {
    await this.notifications.notify(
      e.ownerId,
      T.listingRejected(e.listingId, await this.title(e.listingId), e.reason),
    );
  }

  @OnEvent(ListingEvent.Removed, { async: true })
  async onRemoved(e: ListingStatusEvent): Promise<void> {
    await this.notifications.notify(
      e.ownerId,
      T.listingRemoved(e.listingId, await this.title(e.listingId), e.reason),
    );
  }

  @OnEvent(UserAdminEvent.ListerVerified, { async: true })
  async onVerified(e: UserModeratedEvent): Promise<void> {
    await this.notifications.notify(e.userId, T.listerVerified());
  }

  @OnEvent(UserAdminEvent.ListerVerificationRejected, { async: true })
  async onVerificationRejected(e: UserModeratedEvent): Promise<void> {
    await this.notifications.notify(e.userId, T.verificationRejected(e.reason));
  }

  @OnEvent(EngagementEvent.LeadCreated, { async: true })
  async onLead(e: LeadCreatedEvent): Promise<void> {
    // A visit request has its own, more specific notification.
    if (e.channel === 'visit') return;
    const [title, name] = await Promise.all([this.title(e.listingId), this.name(e.customerId)]);
    await this.notifications.notify(e.ownerId, T.newLead(title, name, e.channel));
  }

  @OnEvent(EngagementEvent.VisitRequested, { async: true })
  async onVisitRequested(e: VisitEvent): Promise<void> {
    const [title, name] = await Promise.all([this.title(e.listingId), this.name(e.customerId)]);
    await this.notifications.notify(
      e.ownerId,
      T.visitRequested(title, name, e.date, e.slot as VisitSlot),
    );
  }

  @OnEvent(EngagementEvent.VisitUpdated, { async: true })
  async onVisitUpdated(e: VisitEvent): Promise<void> {
    const recipient = e.actorId === e.ownerId ? e.customerId : e.ownerId;
    await this.notifications.notify(
      recipient,
      T.visitUpdated(
        e.status as VisitStatus,
        await this.title(e.listingId),
        e.date,
        e.slot as VisitSlot,
      ),
    );
  }

  @OnEvent(EngagementEvent.MessageSent, { async: true })
  async onMessage(e: MessageSentEvent): Promise<void> {
    await this.notifications.notify(
      e.recipientId,
      T.newMessage(e.conversationId, await this.name(e.senderId), e.body),
      // Chat has its own inbox; one device notification per thread, replaced by newer ones.
      { inbox: false, collapseKey: `chat-${e.conversationId}` },
    );
  }

  @OnEvent(EngagementEvent.SavedSearchMatched, { async: true })
  async onSavedSearchMatch(e: SavedSearchMatchedEvent): Promise<void> {
    await this.notifications.notify(
      e.userId,
      T.savedSearchMatch(e.listingId, e.label, await this.title(e.listingId)),
    );
  }

  @OnEvent(FeatureEvent.Activated, { async: true })
  async onFeatureActivated(e: FeatureLifecycleEvent): Promise<void> {
    await this.notifications.notify(
      e.ownerId,
      T.featuredActivated(e.listingId, await this.title(e.listingId), e.endsAt, !!e.renewed),
    );
  }

  @OnEvent(FeatureEvent.Expiring, { async: true })
  async onFeatureExpiring(e: FeatureLifecycleEvent): Promise<void> {
    await this.notifications.notify(
      e.ownerId,
      T.featuredExpiring(e.listingId, await this.title(e.listingId), e.endsAt),
    );
  }

  @OnEvent(FeatureEvent.Ended, { async: true })
  async onFeatureEnded(e: FeatureLifecycleEvent): Promise<void> {
    await this.notifications.notify(
      e.ownerId,
      T.featuredEnded(e.listingId, await this.title(e.listingId)),
    );
  }

  private async title(listingId: string): Promise<string | null> {
    return (await this.catalog.get(listingId).catch(() => null))?.title ?? null;
  }

  private async name(userId: string): Promise<string | null> {
    return (await this.users.findMany([userId])).get(userId)?.fullName ?? null;
  }
}
