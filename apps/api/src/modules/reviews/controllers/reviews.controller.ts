import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { ReviewResponse, ReviewSummaryResponse } from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser, OptionalAuth } from '../../../core/http/decorators/index.js';
import { ReviewDto } from '../dto/review.dto.js';
import { ReviewsService } from '../services/reviews.service.js';

@ApiTags('Reviews')
@Controller('listings/:listingId/reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  /** Average, count, latest reviews; plus the viewer's own review and eligibility. */
  @Get()
  @OptionalAuth()
  summary(
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @CurrentUser() viewer: AuthUser | undefined,
  ): Promise<ReviewSummaryResponse> {
    return this.reviews.summary(listingId, viewer?.id);
  }

  /** Create or edit my review. */
  @Put('me')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  upsert(
    @CurrentUser() user: AuthUser,
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Body() dto: ReviewDto,
  ): Promise<ReviewResponse> {
    return this.reviews.upsert(user.id, listingId, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ): Promise<void> {
    return this.reviews.remove(user.id, listingId);
  }
}
