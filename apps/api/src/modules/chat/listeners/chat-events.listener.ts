import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChatSocketEvent, type MessageResponse } from '@housingcom/contracts';
import { EngagementEvent, type MessageSentEvent } from '../../../core/events/domain-events.js';
import { ChatGateway } from '../gateways/chat.gateway.js';

/** Pushes new messages to both participants' open sockets (all their devices). */
@Injectable()
export class ChatEventsListener {
  constructor(private readonly gateway: ChatGateway) {}

  @OnEvent(EngagementEvent.MessageSent)
  onMessage(event: MessageSentEvent): void {
    const message: MessageResponse = {
      id: event.messageId,
      conversationId: event.conversationId,
      senderId: event.senderId,
      body: event.body,
      createdAt: event.createdAt,
    };
    const participants = [event.senderId, event.recipientId];
    this.gateway.emitTo(participants, ChatSocketEvent.Message, message);
    this.gateway.emitTo(participants, ChatSocketEvent.ConversationUpdated, {
      conversationId: event.conversationId,
    });
  }
}
