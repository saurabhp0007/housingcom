import type {
  ConversationResponse,
  ListingCardResponse,
  MessageResponse,
} from '@housingcom/contracts';
import type { User } from '../../users/entities/user.entity.js';
import type { Message } from '../entities/message.entity.js';
import type { ConversationRow } from '../interfaces/chat-repository.interface.js';

export function toMessageResponse(m: Message): MessageResponse {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  };
}

export function toConversationResponse(
  { conversation: c, unreadCount }: ConversationRow,
  viewerId: string,
  listing: ListingCardResponse,
  counterpart: User | undefined,
): ConversationResponse {
  const iAmOwner = c.ownerId === viewerId;
  return {
    id: c.id,
    listing,
    counterpart: {
      id: iAmOwner ? c.customerId : c.ownerId,
      name: counterpart?.fullName ?? null,
    },
    iAmOwner,
    lastMessage:
      c.lastMessageAt && c.lastMessageSenderId
        ? {
            body: c.lastMessagePreview ?? '',
            senderId: c.lastMessageSenderId,
            createdAt: c.lastMessageAt.toISOString(),
          }
        : null,
    unreadCount,
    updatedAt: (c.lastMessageAt ?? c.createdAt).toISOString(),
  };
}
