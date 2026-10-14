import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  UserRole,
  type FeaturedPlanResponse,
  type ListingFeatureResponse,
  type Paginated,
} from '@housingcom/contracts';
import { Roles } from '../../../core/http/decorators/index.js';
import {
  AdminFeaturesQueryDto,
  FeaturedPlanDto,
  PinListingDto,
  UpdateFeaturedPlanDto,
} from '../dto/featured.dto.js';
import { FeaturedPlansService } from '../services/featured-plans.service.js';
import { ListingFeaturesService } from '../services/listing-features.service.js';

/** Admin: featured pricing and featured listings (PRD §5). */
@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@Controller('admin')
export class AdminFeaturedController {
  constructor(
    private readonly plans: FeaturedPlansService,
    private readonly features: ListingFeaturesService,
  ) {}

  @Get('featured-plans')
  listPlans(): Promise<FeaturedPlanResponse[]> {
    return this.plans.list();
  }

  @Post('featured-plans')
  createPlan(@Body() dto: FeaturedPlanDto): Promise<FeaturedPlanResponse> {
    return this.plans.create(dto);
  }

  @Patch('featured-plans/:id')
  updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeaturedPlanDto,
  ): Promise<FeaturedPlanResponse> {
    return this.plans.update(id, dto);
  }

  @Get('featured')
  list(@Query() q: AdminFeaturesQueryDto): Promise<Paginated<ListingFeatureResponse>> {
    return this.features.adminList(q.status, q.page, q.limit);
  }

  @Post('featured/:id/pause')
  pause(@Param('id', ParseUUIDPipe) id: string): Promise<ListingFeatureResponse> {
    return this.features.pause(id);
  }

  @Post('featured/:id/resume')
  resume(@Param('id', ParseUUIDPipe) id: string): Promise<ListingFeatureResponse> {
    return this.features.resume(id);
  }

  @Post('featured/:id/remove')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<ListingFeatureResponse> {
    return this.features.remove(id);
  }

  /** Feature (and optionally pin) a listing without payment. */
  @Post('listings/:id/feature')
  pin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PinListingDto,
  ): Promise<ListingFeatureResponse> {
    return this.features.pin(id, dto.durationDays, dto.pinned);
  }
}
