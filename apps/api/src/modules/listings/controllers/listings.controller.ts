import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type {
  ListingCardResponse,
  ListingDetailResponse,
  MapResponse,
  Paginated,
} from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser, OptionalAuth, Public } from '../../../core/http/decorators/index.js';
import { MapQueryDto, SearchListingsQueryDto, TrackEventDto } from '../dto/search-query.dto.js';
import { ListingSearchService } from '../services/listing-search.service.js';
import { ListingsQueryService } from '../services/listings-query.service.js';

/** Public discovery. Guests get location + popularity ranking; signed-in users get personal ranking. */
@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly query: ListingsQueryService,
    private readonly searchService: ListingSearchService,
  ) {}

  /** Search with filters; sort = recommended | nearest | newest | most_viewed. */
  @Get()
  @OptionalAuth()
  search(
    @Query() q: SearchListingsQueryDto,
    @CurrentUser() viewer: AuthUser | undefined,
  ): Promise<Paginated<ListingCardResponse>> {
    return this.searchService.search(q, viewer?.id);
  }

  /** Pins for the visible map region (clustered server-side when dense). */
  @Get('map')
  @Public()
  map(@Query() q: MapQueryDto): Promise<MapResponse> {
    return this.searchService.map(q);
  }

  @Get(':id')
  @OptionalAuth()
  detail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() viewer: AuthUser | undefined,
  ): Promise<ListingDetailResponse> {
    return this.query.detail(id, viewer);
  }

  /** "Similar listings nearby" for the listing page. */
  @Get(':id/similar')
  @Public()
  similar(@Param('id', ParseUUIDPipe) id: string): Promise<ListingCardResponse[]> {
    return this.searchService.similar(id);
  }

  /** Records a share (feeds recommendations). */
  @Post(':id/events')
  @OptionalAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  track(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _dto: TrackEventDto,
    @CurrentUser() viewer: AuthUser | undefined,
  ): Promise<void> {
    return this.query.trackShare(id, viewer);
  }
}
