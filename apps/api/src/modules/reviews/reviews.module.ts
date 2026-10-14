import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsModule } from '../leads/leads.module.js';
import { ListingsModule } from '../listings/listings.module.js';
import { ReviewsController } from './controllers/reviews.controller.js';
import { Review } from './entities/review.entity.js';
import { REVIEWS_REPOSITORY } from './interfaces/reviews-repository.interface.js';
import { TypeOrmReviewsRepository } from './repositories/reviews.repository.js';
import { ReviewsService } from './services/reviews.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Review]), ListingsModule, LeadsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, { provide: REVIEWS_REPOSITORY, useClass: TypeOrmReviewsRepository }],
})
export class ReviewsModule {}
