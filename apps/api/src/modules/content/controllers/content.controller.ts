import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { BannerResponse, ContentPageResponse, FaqResponse } from '@housingcom/contracts';
import { Public } from '../../../core/http/decorators/index.js';
import { BannersQueryDto, SlugParam } from '../dto/content.dto.js';
import { ContentService } from '../services/content.service.js';

@ApiTags('Content')
@Public()
@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('faqs')
  faqs(): Promise<FaqResponse[]> {
    return this.content.faqs();
  }

  @Get('pages/:slug')
  page(@Param() { slug }: SlugParam): Promise<ContentPageResponse> {
    return this.content.page(slug);
  }

  /** Live banners for everyone plus the given city's. */
  @Get('banners')
  banners(@Query() q: BannersQueryDto): Promise<BannerResponse[]> {
    return this.content.banners(q.cityId ?? null);
  }
}
