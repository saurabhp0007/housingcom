import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  ListingAction,
  UserRole,
  type ListingDetailResponse,
  type ListingMediaResponse,
  type MyListingResponse,
} from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import { CurrentUser, Roles } from '../../../core/http/decorators/index.js';
import { CreateListingDto, ReorderMediaDto, UpdateListingDto } from '../dto/listing.dto.js';
import { MyListingsQueryDto } from '../dto/listing-query.dto.js';
import { ListingMediaService } from '../services/listing-media.service.js';
import { ListingsService } from '../services/listings.service.js';

/** The signed-in lister's own listings. */
@ApiTags('My listings')
@ApiBearerAuth()
@Roles(UserRole.Lister)
@Controller('me/listings')
export class MyListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly mediaService: ListingMediaService,
  ) {}

  /** Starts a draft. The editor then saves each step with PATCH. */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateListingDto): Promise<ListingDetailResponse> {
    return this.listingsService.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: MyListingsQueryDto): Promise<MyListingResponse[]> {
    return this.listingsService.mine(user.id, query.status);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<ListingDetailResponse> {
    return this.listingsService.getOwned(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateListingDto,
  ): Promise<ListingDetailResponse> {
    return this.listingsService.update(user.id, id, dto);
  }

  /** Verified listers go live instantly; others enter the approval queue. */
  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  submit(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<ListingDetailResponse> {
    return this.listingsService.submit(user.id, id);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  pause(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<ListingDetailResponse> {
    return this.listingsService.changeLifecycle(user.id, id, ListingAction.Pause);
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  resume(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<ListingDetailResponse> {
    return this.listingsService.changeLifecycle(user.id, id, ListingAction.Resume);
  }

  @Post(':id/mark-filled')
  @HttpCode(HttpStatus.OK)
  markFilled(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<ListingDetailResponse> {
    return this.listingsService.changeLifecycle(user.id, id, ListingAction.MarkFilled);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.listingsService.remove(user.id, id);
  }

  /** One photo or video per request (multipart field "file"). Photos are compressed server-side. */
  @Post(':id/media')
  @ApiConsumes('multipart/form-data')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ListingMediaResponse> {
    if (!file) throw AppException.badRequest(ErrorCode.InvalidMedia, 'Attach the photo or video as "file"');
    return this.mediaService.upload(user.id, id, file);
  }

  @Patch(':id/media/order')
  reorder(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderMediaDto,
  ): Promise<ListingMediaResponse[]> {
    return this.mediaService.reorder(user.id, id, dto.mediaIds);
  }

  @Delete(':id/media/:mediaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMedia(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
  ): Promise<void> {
    return this.mediaService.remove(user.id, id, mediaId);
  }
}
