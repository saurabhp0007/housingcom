import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { SavedSearchResponse } from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser } from '../../../core/http/decorators/index.js';
import { SavedSearchDto } from '../dto/saved-search.dto.js';
import { SavedSearchesService } from '../services/saved-searches.service.js';

@ApiTags('Saved searches')
@ApiBearerAuth()
@Controller('me/saved-searches')
export class SavedSearchesController {
  constructor(private readonly searches: SavedSearchesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<SavedSearchResponse[]> {
    return this.searches.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: SavedSearchDto): Promise<SavedSearchResponse> {
    return this.searches.create(user.id, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SavedSearchDto,
  ): Promise<SavedSearchResponse> {
    return this.searches.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.searches.remove(user.id, id);
  }
}
