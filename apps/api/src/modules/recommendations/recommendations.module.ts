import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminRecommendationsController } from './controllers/admin-recommendations.controller.js';
import { ListingActivity } from './entities/listing-activity.entity.js';
import { RecommendationSettings } from './entities/recommendation-settings.entity.js';
import { RECOMMENDATIONS_REPOSITORY } from './interfaces/recommendations-repository.interface.js';
import { TypeOrmRecommendationsRepository } from './repositories/recommendations.repository.js';
import { RecommendationsService } from './services/recommendations.service.js';

/** Recommendation inputs: admin-tuned weights and user activity → interest profiles. */
@Module({
  imports: [TypeOrmModule.forFeature([RecommendationSettings, ListingActivity])],
  controllers: [AdminRecommendationsController],
  providers: [RecommendationsService, { provide: RECOMMENDATIONS_REPOSITORY, useClass: TypeOrmRecommendationsRepository }],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
