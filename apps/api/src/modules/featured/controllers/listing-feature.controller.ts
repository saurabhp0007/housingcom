import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  UserRole,
  type CheckoutResponse,
  type FeatureOptionsResponse,
  type ListingFeatureResponse,
} from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser, Roles } from '../../../core/http/decorators/index.js';
import { FeatureCheckoutDto } from '../dto/featured.dto.js';
import { ListingFeaturesService } from '../services/listing-features.service.js';

/** Lister: pick a plan, pay, and track featured performance. */
@ApiTags('Featured')
@ApiBearerAuth()
@Roles(UserRole.Lister)
@Controller('me')
export class ListingFeatureController {
  constructor(private readonly features: ListingFeaturesService) {}

  @Get('featured')
  mine(@CurrentUser() user: AuthUser): Promise<ListingFeatureResponse[]> {
    return this.features.mine(user.id);
  }

  @Get('listings/:id/feature-options')
  options(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FeatureOptionsResponse> {
    return this.features.options(user.id, id);
  }

  /** Creates the gateway order; the app then opens the payment sheet. */
  @Post('listings/:id/feature/checkout')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  checkout(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FeatureCheckoutDto,
  ): Promise<CheckoutResponse> {
    return this.features.checkout(user.id, id, dto.planId);
  }
}
