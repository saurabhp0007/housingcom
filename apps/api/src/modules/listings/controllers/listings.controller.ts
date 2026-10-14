import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { ListingCardResponse, ListingDetailResponse, Paginated } from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser, OptionalAuth, Public } from '../../../core/http/decorators/index.js';
import { BrowseListingsQueryDto } from '../dto/listing-query.dto.js';
import { ListingsQueryService } from '../services/listings-query.service.js';

/** Public browsing. Guests can browse; signing in only adds owner/admin visibility. */
@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly query: ListingsQueryService) {}

  /** Live listings, optionally near a point (nearest or newest first). Full search arrives in phase 3. */
  @Get()
  @Public()
  browse(@Query() q: BrowseListingsQueryDto): Promise<Paginated<ListingCardResponse>> {
    return this.query.browse(q);
  }

  @Get(':id')
  @OptionalAuth()
  detail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() viewer: AuthUser | undefined,
  ): Promise<ListingDetailResponse> {
    return this.query.detail(id, viewer);
  }
}
