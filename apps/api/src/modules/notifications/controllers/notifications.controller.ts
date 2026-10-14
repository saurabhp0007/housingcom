import {
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
import type { NotificationResponse, Paginated } from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser } from '../../../core/http/decorators/index.js';
import { PageQueryDto } from '../../../core/http/dto/page-query.dto.js';
import { NotificationsService } from '../services/notifications.service.js';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('me/notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() q: PageQueryDto,
  ): Promise<Paginated<NotificationResponse>> {
    return this.notifications.list(user.id, q.page, q.limit);
  }

  @Get('unread-count')
  async unread(@CurrentUser() user: AuthUser): Promise<{ count: number }> {
    return { count: await this.notifications.unreadCount(user.id) };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  readAll(@CurrentUser() user: AuthUser): Promise<void> {
    return this.notifications.markAllRead(user.id);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  read(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.notifications.markRead(user.id, id);
  }
}
