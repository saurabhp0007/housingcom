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
