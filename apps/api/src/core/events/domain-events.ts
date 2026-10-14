import type { Platform, UpdateChannel } from '@housingcom/contracts';

/**
 * Domain event names. Emitters and listeners import these constants; never use string literals.
 * In-process events go through @nestjs/event-emitter; slow or retryable work is pushed to BullMQ
 * by listeners.
 */
export const DomainEvent = {
  UserRegistered: 'user.registered',
  UserBecameLister: 'user.became_lister',
  UserLoggedIn: 'user.logged_in',
  OtaUpdatePublished: 'ota.update.published',
  OtaUpdateAutoPaused: 'ota.update.auto_paused',
} as const;

export interface UserRegisteredEvent {
  userId: string;
  provider: string;
}

export interface UserBecameListerEvent {
  userId: string;
  listerType: string;
}

export interface UserLoggedInEvent {
  userId: string;
  deviceId?: string;
  platform?: Platform;
}

export interface OtaUpdatePublishedEvent {
  updateIds: string[];
  channel: UpdateChannel;
  runtimeVersions: Partial<Record<Platform, string>>;
  rolloutPercent: number;
}

export interface OtaUpdateAutoPausedEvent {
  updateId: string;
  launchCount: number;
  crashCount: number;
  crashRate: number;
}

export const ListingEvent = {
  Submitted: 'listing.submitted',
  Published: 'listing.published',
  Approved: 'listing.approved',
  Rejected: 'listing.rejected',
  Removed: 'listing.removed',
  StatusChanged: 'listing.status_changed',
  Viewed: 'listing.viewed',
  LocationChanged: 'listing.location_changed',
  Shared: 'listing.shared',
  /** Featured listings were shown in a featured slot (search top / home section). */
  FeaturedImpressions: 'listing.featured_impressions',
} as const;

export interface FeaturedImpressionsEvent {
  listingIds: string[];
}

export interface ListingStatusEvent {
  listingId: string;
  ownerId: string;
  from: string;
  to: string;
  actorId: string;
  reason?: string;
}

export interface ListingViewedEvent {
  listingId: string;
  viewerId: string | null;
}

export interface ListingLocationChangedEvent {
  listingId: string;
}

export const UserAdminEvent = {
  Blocked: 'user.blocked',
  Unblocked: 'user.unblocked',
  ListerVerified: 'lister.verified',
  ListerVerificationRejected: 'lister.verification_rejected',
} as const;

export interface UserModeratedEvent {
  userId: string;
  actorId: string;
  reason?: string;
}

export const EngagementEvent = {
  LeadCreated: 'lead.created',
  VisitRequested: 'visit.requested',
  VisitUpdated: 'visit.updated',
  MessageSent: 'chat.message_sent',
  SavedSearchMatched: 'saved_search.matched',
} as const;

export interface LeadCreatedEvent {
  leadId: string;
  listingId: string;
  ownerId: string;
  customerId: string;
  channel: string;
}

export interface VisitEvent {
  visitId: string;
  listingId: string;
  ownerId: string;
  customerId: string;
  status: string;
  date: string;
  slot: string;
  /** Who caused the change. */
  actorId: string;
}

export interface MessageSentEvent {
  messageId: string;
  conversationId: string;
  listingId: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
}

export interface SavedSearchMatchedEvent {
  userId: string;
  savedSearchId: string;
  label: string;
  listingId: string;
}

export const PaymentEvent = {
  Succeeded: 'payment.succeeded',
  Failed: 'payment.failed',
} as const;

export interface PaymentSucceededEvent {
  paymentId: string;
  userId: string;
  purpose: string;
  referenceId: string | null;
  amountInr: number;
  metadata: Record<string, unknown>;
}

export interface PaymentFailedEvent {
  paymentId: string;
  userId: string;
  reason: string | null;
}

export const FeatureEvent = {
  Activated: 'feature.activated',
  Expiring: 'feature.expiring',
  Ended: 'feature.ended',
} as const;

export interface FeatureLifecycleEvent {
  featureId: string;
  listingId: string;
  ownerId: string;
  endsAt: string;
  /** Activated only: true when an existing period was extended. */
  renewed?: boolean;
}
