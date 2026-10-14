import type { BroadcastResponse, NotificationResponse } from '@housingcom/contracts';
import type { Broadcast } from '../entities/broadcast.entity.js';
import type { Notification } from '../entities/notification.entity.js';

export function toNotificationResponse(n: Notification): NotificationResponse {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    url: n.url,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  };
}

export function toBroadcastResponse(b: Broadcast): BroadcastResponse {
  return {
    id: b.id,
    title: b.title,
    body: b.body,
    cityId: b.cityId,
    recipientCount: b.recipientCount,
    createdAt: b.createdAt.toISOString(),
  };
}
