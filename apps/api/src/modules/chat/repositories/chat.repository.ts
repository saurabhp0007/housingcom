import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository, type SelectQueryBuilder } from 'typeorm';
import type { Paginated } from '@housingcom/contracts';
import { buildPaginationMeta } from '../../../core/utils/pagination.util.js';
import { Conversation } from '../entities/conversation.entity.js';
import { Message } from '../entities/message.entity.js';
import {
  pairKey,
  type ChatRepository,
  type ConversationRow,
} from '../interfaces/chat-repository.interface.js';

const PREVIEW_LENGTH = 160;

/** Messages from the other participant newer than the viewer's read marker. */
const UNREAD_SQL = `(
  SELECT COUNT(*) FROM messages m
  WHERE m.conversation_id = c.id AND m.sender_id <> :userId
    AND m.created_at > COALESCE(
      CASE WHEN c.customer_id = :userId THEN c.customer_last_read_at ELSE c.owner_last_read_at END,
      'epoch'::timestamptz)
)`;

@Injectable()
export class TypeOrmChatRepository implements ChatRepository {
  constructor(
    @InjectRepository(Conversation) private readonly conversations: Repository<Conversation>,
    @InjectRepository(Message) private readonly messagesRepo: Repository<Message>,
    private readonly dataSource: DataSource,
  ) {}

  async findOrCreate(
    listingId: string,
    customerId: string,
    ownerId: string,
  ): Promise<Conversation> {
    await this.conversations
      .createQueryBuilder()
      .insert()
      .values({ listingId, customerId, ownerId })
      .orIgnore()
      .execute();
    return this.conversations.findOneByOrFail({ listingId, customerId });
  }

  findById(id: string): Promise<Conversation | null> {
    return this.conversations.findOneBy({ id });
  }

  async findIdsByPairs(
    pairs: { listingId: string; customerId: string }[],
  ): Promise<Map<string, string>> {
    if (pairs.length === 0) return new Map();
    const rows = await this.conversations
      .createQueryBuilder('c')
      .select(['c.id', 'c.listingId', 'c.customerId'])
      .where(
        '(c.listing_id, c.customer_id) IN (SELECT * FROM unnest(CAST(:listingIds AS uuid[]), CAST(:customerIds AS uuid[])))',
        {
          listingIds: pairs.map((p) => p.listingId),
          customerIds: pairs.map((p) => p.customerId),
        },
      )
      .getMany();
    return new Map(rows.map((r) => [pairKey(r.listingId, r.customerId), r.id]));
  }

  async listForUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<Paginated<ConversationRow>> {
    const qb = this.forUser(userId)
      .addSelect(UNREAD_SQL, 'unread_count')
      .orderBy('c.last_message_at', 'DESC', 'NULLS LAST')
      .addOrderBy('c.created_at', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit);
    const [{ entities, raw }, total] = await Promise.all([
      qb.getRawAndEntities<{ unread_count: string }>(),
      this.forUser(userId).getCount(),
    ]);
    return {
      items: entities.map((conversation, i) => ({
        conversation,
        unreadCount: Number(raw[i]?.unread_count ?? 0),
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async messages(conversationId: string, before: string | null, limit: number): Promise<Message[]> {
    const qb = this.messagesRepo
      .createQueryBuilder('m')
      .where('m.conversation_id = :conversationId', { conversationId })
      .orderBy('m.created_at', 'DESC')
      .addOrderBy('m.id', 'DESC')
      .limit(limit);
    if (before) {
      qb.andWhere(
        `(m.created_at, m.id) < (SELECT b.created_at, b.id FROM messages b WHERE b.id = :before)`,
        { before },
      );
    }
    return qb.getMany();
  }

  addMessage(conversation: Conversation, senderId: string, body: string): Promise<Message> {
    return this.dataSource.transaction(async (manager) => {
      const message = await manager.save(
        manager.create(Message, { conversationId: conversation.id, senderId, body }),
      );
      const readField =
        senderId === conversation.customerId ? 'customerLastReadAt' : 'ownerLastReadAt';
      await manager.update(
        Conversation,
        { id: conversation.id },
        {
          lastMessageAt: message.createdAt,
          lastMessagePreview: body.slice(0, PREVIEW_LENGTH),
          lastMessageSenderId: senderId,
          // Sending implies having read everything before it.
          [readField]: message.createdAt,
        },
      );
      return message;
    });
  }

  async markRead(conversation: Conversation, userId: string, at: Date): Promise<void> {
    const field = userId === conversation.customerId ? 'customerLastReadAt' : 'ownerLastReadAt';
    await this.conversations.update({ id: conversation.id }, { [field]: at });
  }

  async totalUnread(userId: string): Promise<number> {
    const row = await this.forUser(userId)
      .select(`COALESCE(SUM(${UNREAD_SQL}), 0)`, 'total')
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }

  async unreadIn(conversationId: string, userId: string): Promise<number> {
    const row = await this.forUser(userId)
      .select(UNREAD_SQL, 'total')
      .andWhere('c.id = :conversationId', { conversationId })
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }

  private forUser(userId: string): SelectQueryBuilder<Conversation> {
    return this.conversations
      .createQueryBuilder('c')
      .where(
        new Brackets((w) => w.where('c.customer_id = :userId').orWhere('c.owner_id = :userId')),
      )
      .setParameter('userId', userId);
  }
}
