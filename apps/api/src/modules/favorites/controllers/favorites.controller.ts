import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ListingCardResponse, Paginated } from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser } from '../../../core/http/decorators/index.js';
import { PageQueryDto } from '../../../core/http/dto/page-query.dto.js';
import { FavoritesService } from '../services/favorites.service.js';

@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('me/favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() q: PageQueryDto,
  ): Promise<Paginated<ListingCardResponse>> {
    return this.favorites.list(user.id, q.page, q.limit);
  }

  /** All saved listing ids, so the app can paint hearts on any card. */
  @Get('ids')
  ids(@CurrentUser() user: AuthUser): Promise<string[]> {
    return this.favorites.ids(user.id);
  }

  @Put(':listingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  save(
    @CurrentUser() user: AuthUser,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ): Promise<void> {
    return this.favorites.save(user.id, listingId);
  }

  @Delete(':listingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ): Promise<void> {
    return this.favorites.remove(user.id, listingId);
  }
}
