import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  UserRole,
  type ListingDetailResponse,
  type MyListingResponse,
  type Paginated,
} from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser, Roles } from '../../../core/http/decorators/index.js';
import { ModerationQueueQueryDto, RejectDto } from '../dto/listing-query.dto.js';
import { ListingModerationService } from '../services/listing-moderation.service.js';

@ApiTags('Admin · Listings')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@Controller('admin/listings')
export class AdminListingsController {
  constructor(private readonly moderation: ListingModerationService) {}

  /** Defaults to the approval queue (oldest submission first). */
  @Get()
  queue(@Query() q: ModerationQueueQueryDto): Promise<Paginated<MyListingResponse>> {
    return this.moderation.queue(q.status, q.page, q.limit);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<ListingDetailResponse> {
    return this.moderation.get(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(@CurrentUser() admin: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<ListingDetailResponse> {
    return this.moderation.approve(admin.id, id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectDto,
  ): Promise<ListingDetailResponse> {
    return this.moderation.reject(admin.id, id, dto.reason);
  }
}
