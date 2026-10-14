import type { Paginated } from '@housingcom/contracts';
import type { Broadcast } from '../entities/broadcast.entity.js';
import type { Notification } from '../entities/notification.entity.js';

export const NOTIFICATIONS_REPOSITORY = Symbol('NOTIFICATIONS_REPOSITORY');

export type NotificationData = Pick<Notification, 'userId' | 'type' | 'title' | 'body' | 'url'>;

export interface NotificationsRepository {
  create(data: NotificationData): Promise<Notification>;
  page(userId: string, page: number, limit: number): Promise<Paginated<Notification>>;
  unreadCount(userId: string): Promise<number>;
  markRead(userId: string, id: string, at: Date): Promise<void>;
  markAllRead(userId: string, at: Date): Promise<void>;
  /** Inbox rows for every active user (optionally in one city) in one statement; returns the count. */
  createForAudience(cityId: string | null, data: Omit<NotificationData, 'userId'>): Promise<number>;
  createBroadcast(
    data: Pick<Broadcast, 'title' | 'body' | 'cityId' | 'createdBy'>,
  ): Promise<Broadcast>;
  setBroadcastRecipients(id: string, count: number): Promise<void>;
  broadcasts(page: number, limit: number): Promise<Paginated<Broadcast>>;
}
