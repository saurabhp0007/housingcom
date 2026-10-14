import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UserStatus, type Paginated } from '@housingcom/contracts';
import { buildPaginationMeta } from '../../../core/utils/pagination.util.js';
import { Broadcast } from '../entities/broadcast.entity.js';
import { Notification } from '../entities/notification.entity.js';
import type {
  NotificationData,
  NotificationsRepository,
} from '../interfaces/notifications-repository.interface.js';

@Injectable()
export class TypeOrmNotificationsRepository implements NotificationsRepository {
  constructor(
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
    @InjectRepository(Broadcast) private readonly broadcastsRepo: Repository<Broadcast>,
  ) {}

  create(data: NotificationData): Promise<Notification> {
    return this.notifications.save(this.notifications.create(data));
  }

  async page(userId: string, page: number, limit: number): Promise<Paginated<Notification>> {
    const [items, total] = await this.notifications.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  unreadCount(userId: string): Promise<number> {
    return this.notifications.countBy({ userId, readAt: IsNull() });
  }

  async markRead(userId: string, id: string, at: Date): Promise<void> {
    await this.notifications.update({ id, userId, readAt: IsNull() }, { readAt: at });
  }

  async markAllRead(userId: string, at: Date): Promise<void> {
    await this.notifications.update({ userId, readAt: IsNull() }, { readAt: at });
  }

  async createForAudience(
    cityId: string | null,
    data: Omit<NotificationData, 'userId'>,
  ): Promise<number> {
    // INSERT … SELECT keeps a city-wide fan-out to one round trip, whatever the audience size.
    const rows: { count: string }[] = await this.notifications.query(
      `WITH inserted AS (
         INSERT INTO notifications (user_id, type, title, body, url)
         SELECT u.id, $1, $2, $3, $4 FROM users u
         WHERE u.status = $5 AND ($6::uuid IS NULL OR u.preferred_city_id = $6::uuid)
         RETURNING 1
       ) SELECT COUNT(*) AS count FROM inserted`,
      [data.type, data.title, data.body, data.url, UserStatus.Active, cityId],
    );
    return Number(rows[0]?.count ?? 0);
  }

  createBroadcast(
    data: Pick<Broadcast, 'title' | 'body' | 'cityId' | 'createdBy'>,
  ): Promise<Broadcast> {
    return this.broadcastsRepo.save(this.broadcastsRepo.create(data));
  }

  async setBroadcastRecipients(id: string, count: number): Promise<void> {
    await this.broadcastsRepo.update({ id }, { recipientCount: count });
  }

  async broadcasts(page: number, limit: number): Promise<Paginated<Broadcast>> {
    const [items, total] = await this.broadcastsRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }
}
