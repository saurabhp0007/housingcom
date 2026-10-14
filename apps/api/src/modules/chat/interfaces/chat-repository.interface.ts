import type { Paginated } from '@housingcom/contracts';
import type { Conversation } from '../entities/conversation.entity.js';
import type { Message } from '../entities/message.entity.js';

export const CHAT_REPOSITORY = Symbol('CHAT_REPOSITORY');

export interface ConversationRow {
  conversation: Conversation;
  unreadCount: number;
}

export interface ChatRepository {
  /** Idempotent: returns the existing thread for (listing, customer) or creates it. */
  findOrCreate(listingId: string, customerId: string, ownerId: string): Promise<Conversation>;
  findById(id: string): Promise<Conversation | null>;
  findIdsByPairs(pairs: { listingId: string; customerId: string }[]): Promise<Map<string, string>>;
  /** The user's threads (as customer or owner), most recent first, with unread counts. */
  listForUser(userId: string, page: number, limit: number): Promise<Paginated<ConversationRow>>;
  /** Newest first; `before` is a message id to page backwards from. */
  messages(conversationId: string, before: string | null, limit: number): Promise<Message[]>;
  /** Inserts the message and updates the thread's last-message fields atomically. */
  addMessage(conversation: Conversation, senderId: string, body: string): Promise<Message>;
  markRead(conversation: Conversation, userId: string, at: Date): Promise<void>;
  totalUnread(userId: string): Promise<number>;
  unreadIn(conversationId: string, userId: string): Promise<number>;
}

/** Key for findIdsByPairs results. */
export const pairKey = (listingId: string, customerId: string) => `${listingId}:${customerId}`;
