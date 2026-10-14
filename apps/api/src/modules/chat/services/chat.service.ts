import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  ConversationResponse,
  ListingCardResponse,
  MessageResponse,
  Paginated,
} from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { EngagementEvent, type MessageSentEvent } from '../../../core/events/domain-events.js';
import { ListingCatalogService } from '../../listings/services/listing-catalog.service.js';
import { UsersService } from '../../users/services/users.service.js';
import type { Conversation } from '../entities/conversation.entity.js';
import { CHAT_REPOSITORY, type ChatRepository } from '../interfaces/chat-repository.interface.js';
import { toConversationResponse, toMessageResponse } from '../mappers/chat.mapper.js';

/** Placeholder card when a listing was deleted but the thread history remains. */
const removedListingCard = (id: string): ListingCardResponse => ({
  id,
  type: 'room',
  title: 'Listing no longer available',
  rent: 0,
  deposit: null,
  sharing: null,
  gender: null,
  furnishing: null,
  foodIncluded: false,
  areaName: null,
  cityName: null,
  location: null,
  coverUrl: null,
  isVerifiedLister: false,
  publishedAt: null,
  ratingAverage: null,
  ratingCount: 0,
  isFeatured: false,
});

/**
 * In-app chat between a customer and a listing owner. Messages are written over REST
 * (reliable, retryable) and fanned out in real time by the gateway via MessageSent.
 */
@Injectable()
export class ChatService {
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly chat: ChatRepository,
    private readonly catalog: ListingCatalogService,
    private readonly users: UsersService,
    private readonly events: EventEmitter2,
  ) {}

  /** Opens (or returns) the thread for this customer on this listing. */
  async open(listingId: string, customerId: string, ownerId: string): Promise<string> {
    return (await this.chat.findOrCreate(listingId, customerId, ownerId)).id;
  }

  conversationIdsFor(
    pairs: { listingId: string; customerId: string }[],
  ): Promise<Map<string, string>> {
    return this.chat.findIdsByPairs(pairs);
  }

  async list(
    userId: string,
    page: number,
    limit: number,
  ): Promise<Paginated<ConversationResponse>> {
    const { items, meta } = await this.chat.listForUser(userId, page, limit);
    const [cards, people] = await Promise.all([
      this.catalog.cards(items.map((r) => r.conversation.listingId)),
      this.users.findMany(
        items.map((r) =>
          r.conversation.ownerId === userId ? r.conversation.customerId : r.conversation.ownerId,
        ),
      ),
    ]);
    return {
      items: items.map((row) => {
        const c = row.conversation;
        return toConversationResponse(
          row,
          userId,
          cards.get(c.listingId) ?? removedListingCard(c.listingId),
          people.get(c.ownerId === userId ? c.customerId : c.ownerId),
        );
      }),
      meta,
    };
  }

  async get(userId: string, conversationId: string): Promise<ConversationResponse> {
    const conversation = await this.participantOf(userId, conversationId);
    const counterpartId =
      conversation.ownerId === userId ? conversation.customerId : conversation.ownerId;
    const [cards, people, unread] = await Promise.all([
      this.catalog.cards([conversation.listingId]),
      this.users.findMany([counterpartId]),
      this.chat.unreadIn(conversation.id, userId),
    ]);
    return toConversationResponse(
      { conversation, unreadCount: unread },
      userId,
      cards.get(conversation.listingId) ?? removedListingCard(conversation.listingId),
      people.get(counterpartId),
    );
  }

  async messages(
    userId: string,
    conversationId: string,
    before: string | null,
    limit: number,
  ): Promise<MessageResponse[]> {
    await this.participantOf(userId, conversationId);
    return (await this.chat.messages(conversationId, before, limit)).map(toMessageResponse);
  }

  async send(userId: string, conversationId: string, body: string): Promise<MessageResponse> {
    const conversation = await this.participantOf(userId, conversationId);
    const message = await this.chat.addMessage(conversation, userId, body);
    this.events.emit(EngagementEvent.MessageSent, {
      messageId: message.id,
      conversationId,
      listingId: conversation.listingId,
      senderId: userId,
      recipientId: userId === conversation.ownerId ? conversation.customerId : conversation.ownerId,
      body,
      createdAt: message.createdAt.toISOString(),
    } satisfies MessageSentEvent);
    return toMessageResponse(message);
  }

  async markRead(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.participantOf(userId, conversationId);
    await this.chat.markRead(conversation, userId, new Date());
  }

  unreadCount(userId: string): Promise<number> {
    return this.chat.totalUnread(userId);
  }

  /** Non-participants get a 404, so thread ids can't be probed. */
  private async participantOf(userId: string, conversationId: string): Promise<Conversation> {
    const conversation = await this.chat.findById(conversationId);
    if (!conversation || (conversation.customerId !== userId && conversation.ownerId !== userId)) {
      throw AppException.notFound('Conversation');
    }
    return conversation;
  }
}
