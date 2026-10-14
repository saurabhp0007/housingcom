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
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  UserRole,
  type BannerResponse,
  type ContentPageResponse,
  type FaqResponse,
} from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import { CurrentUser, Roles } from '../../../core/http/decorators/index.js';
import {
  BannerDto,
  ContentPageDto,
  FaqDto,
  SlugParam,
  UpdateBannerDto,
  UpdateFaqDto,
} from '../dto/content.dto.js';
import { ContentService } from '../services/content.service.js';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@Controller('admin/content')
export class AdminContentController {
  constructor(private readonly content: ContentService) {}

  // FAQs
  @Get('faqs')
  faqs(): Promise<FaqResponse[]> {
    return this.content.allFaqs();
  }

  @Post('faqs')
  createFaq(@Body() dto: FaqDto): Promise<FaqResponse> {
    return this.content.saveFaq(null, dto);
  }

  @Patch('faqs/:id')
  updateFaq(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFaqDto,
  ): Promise<FaqResponse> {
    return this.content.saveFaq(id, dto);
  }

  @Delete('faqs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFaq(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.content.deleteFaq(id);
  }

  // Pages
  @Put('pages/:slug')
  savePage(
    @Param() { slug }: SlugParam,
    @Body() dto: ContentPageDto,
    @CurrentUser() admin: AuthUser,
  ): Promise<ContentPageResponse> {
    return this.content.savePage(slug, dto, admin.id);
  }

  // Banners
  @Get('banners')
  banners(): Promise<BannerResponse[]> {
    return this.content.allBanners();
  }

  @Post('banners')
  createBanner(@Body() dto: BannerDto): Promise<BannerResponse> {
    return this.content.saveBanner(null, dto);
  }

  @Patch('banners/:id')
  updateBanner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBannerDto,
  ): Promise<BannerResponse> {
    return this.content.saveBanner(id, dto);
  }

  /** Multipart `image`; stored as a 1200×600 WebP. */
  @Post('banners/:id/image')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  bannerImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<BannerResponse> {
    if (!file) throw AppException.badRequest(ErrorCode.InvalidMedia, 'Attach an image');
    return this.content.setBannerImage(id, file.buffer);
  }

  @Delete('banners/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteBanner(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.content.deleteBanner(id);
  }
}
