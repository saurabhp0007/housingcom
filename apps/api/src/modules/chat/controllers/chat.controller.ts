import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { ConversationResponse, MessageResponse, Paginated } from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser } from '../../../core/http/decorators/index.js';
import { PageQueryDto } from '../../../core/http/dto/page-query.dto.js';
import { MessagesQueryDto, SendMessageDto } from '../dto/chat.dto.js';
import { ChatService } from '../services/chat.service.js';

/** Threads are opened from POST /listings/:id/contact with channel "chat". */
@ApiTags('Chat')
@ApiBearerAuth()
@Controller('me/conversations')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() q: PageQueryDto,
  ): Promise<Paginated<ConversationResponse>> {
    return this.chat.list(user.id, q.page, q.limit);
  }

  @Get('unread-count')
  async unread(@CurrentUser() user: AuthUser): Promise<{ count: number }> {
    return { count: await this.chat.unreadCount(user.id) };
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ConversationResponse> {
    return this.chat.get(user.id, id);
  }

  /** Newest first. */
  @Get(':id/messages')
  messages(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() q: MessagesQueryDto,
  ): Promise<MessageResponse[]> {
    return this.chat.messages(user.id, id, q.before ?? null, q.limit);
  }

  @Post(':id/messages')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  send(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ): Promise<MessageResponse> {
    return this.chat.send(user.id, id, dto.body.trim());
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  read(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.chat.markRead(user.id, id);
  }
}
