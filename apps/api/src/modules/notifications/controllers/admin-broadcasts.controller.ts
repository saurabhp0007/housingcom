import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole, type BroadcastResponse, type Paginated } from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser, Roles } from '../../../core/http/decorators/index.js';
import { PageQueryDto } from '../../../core/http/dto/page-query.dto.js';
import { BroadcastDto } from '../dto/notifications.dto.js';
import { NotificationsService } from '../services/notifications.service.js';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@Controller('admin/broadcasts')
export class AdminBroadcastsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Query() q: PageQueryDto): Promise<Paginated<BroadcastResponse>> {
    return this.notifications.broadcasts(q.page, q.limit);
  }

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  send(@CurrentUser() admin: AuthUser, @Body() dto: BroadcastDto): Promise<BroadcastResponse> {
    return this.notifications.broadcast(admin.id, dto);
  }
}
