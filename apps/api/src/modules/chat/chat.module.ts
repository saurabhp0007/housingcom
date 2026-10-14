import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { ListingsModule } from '../listings/listings.module.js';
import { UsersModule } from '../users/users.module.js';
import { ChatController } from './controllers/chat.controller.js';
import { Conversation } from './entities/conversation.entity.js';
import { Message } from './entities/message.entity.js';
import { ChatGateway } from './gateways/chat.gateway.js';
import { CHAT_REPOSITORY } from './interfaces/chat-repository.interface.js';
import { ChatEventsListener } from './listeners/chat-events.listener.js';
import { TypeOrmChatRepository } from './repositories/chat.repository.js';
import { ChatService } from './services/chat.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    AuthModule,
    ListingsModule,
    UsersModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    ChatEventsListener,
    { provide: CHAT_REPOSITORY, useClass: TypeOrmChatRepository },
  ],
  exports: [ChatService],
})
export class ChatModule {}
