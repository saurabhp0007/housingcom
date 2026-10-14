import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';
import type {
  BroadcastInput,
  BroadcastResponse,
  NotificationResponse,
  Paginated,
} from '@housingcom/contracts';
import { QueueName } from '../../../core/queue/queue.constants.js';
import {
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepository,
} from '../interfaces/notifications-repository.interface.js';
import type { PushMessage } from '../interfaces/push-provider.interface.js';
import { toBroadcastResponse, toNotificationResponse } from '../mappers/notification.mapper.js';
import {
  NotificationTemplates,
  type NotificationContent,
} from '../policies/notification-templates.js';

export const PushJobName = { Users: 'users', Audience: 'audience' } as const;

export type PushJob =
  | { kind: 'users'; userIds: string[]; message: PushMessage }
  | { kind: 'audience'; cityId: string | null; message: PushMessage };

export interface NotifyOptions {
  /** false = push only (e.g. chat messages, which live in the chat inbox instead). */
  inbox?: boolean;
  collapseKey?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY) private readonly repo: NotificationsRepository,
    @InjectQueue(QueueName.Push) private readonly queue: Queue<PushJob>,
  ) {}

  /** Writes the inbox entry and queues the push. Never throws into the caller's flow. */
  async notify(
    userId: string,
    content: NotificationContent,
    { inbox = true, collapseKey }: NotifyOptions = {},
  ): Promise<void> {
    try {
      if (inbox) await this.repo.create({ userId, ...content });
      await this.enqueue({
        kind: 'users',
        userIds: [userId],
        message: this.toPush(content, collapseKey),
      });
    } catch (err) {
      this.logger.warn({ err, userId, type: content.type }, 'Notification failed');
    }
  }

  async list(
    userId: string,
    page: number,
    limit: number,
  ): Promise<Paginated<NotificationResponse>> {
    const { items, meta } = await this.repo.page(userId, page, limit);
    return { items: items.map(toNotificationResponse), meta };
  }

  unreadCount(userId: string): Promise<number> {
    return this.repo.unreadCount(userId);
  }

  markRead(userId: string, id: string): Promise<void> {
    return this.repo.markRead(userId, id, new Date());
  }

  markAllRead(userId: string): Promise<void> {
    return this.repo.markAllRead(userId, new Date());
  }

  /** Admin announcement: inbox rows in one statement, pushes paged in the background. */
  async broadcast(adminId: string, input: BroadcastInput): Promise<BroadcastResponse> {
    const cityId = input.cityId ?? null;
    const content = NotificationTemplates.announcement(input.title, input.body);
    const broadcast = await this.repo.createBroadcast({
      title: input.title,
      body: input.body,
      cityId,
      createdBy: adminId,
    });
    const recipients = await this.repo.createForAudience(cityId, content);
    await this.repo.setBroadcastRecipients(broadcast.id, recipients);
    await this.enqueue({ kind: 'audience', cityId, message: this.toPush(content) });
    return toBroadcastResponse({ ...broadcast, recipientCount: recipients });
  }

  async broadcasts(page: number, limit: number): Promise<Paginated<BroadcastResponse>> {
    const { items, meta } = await this.repo.broadcasts(page, limit);
    return { items: items.map(toBroadcastResponse), meta };
  }

  private toPush(content: NotificationContent, collapseKey?: string): PushMessage {
    return {
      title: content.title,
      body: content.body,
      data: { type: content.type, url: content.url },
      collapseKey,
    };
  }

  private async enqueue(job: PushJob): Promise<void> {
    await this.queue.add(job.kind, job, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: true,
      removeOnFail: 1000,
    });
  }
}
