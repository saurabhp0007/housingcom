import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole, type RecommendationWeights } from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser, Roles } from '../../../core/http/decorators/index.js';
import { RecommendationWeightsDto } from '../dto/recommendation-weights.dto.js';
import { RecommendationsService } from '../services/recommendations.service.js';

@ApiTags('Admin · Recommendations')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@Controller('admin/recommendation-settings')
export class AdminRecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Get()
  get(): Promise<RecommendationWeights> {
    return this.recommendations.getWeights();
  }

  @Put()
  update(
    @CurrentUser() admin: AuthUser,
    @Body() dto: RecommendationWeightsDto,
  ): Promise<RecommendationWeights> {
    return this.recommendations.updateWeights(dto, admin.id);
  }
}
