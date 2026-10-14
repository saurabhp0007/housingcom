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
  StatusChanged: 'listing.status_changed',
  Viewed: 'listing.viewed',
  LocationChanged: 'listing.location_changed',
  Shared: 'listing.shared',
} as const;

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
