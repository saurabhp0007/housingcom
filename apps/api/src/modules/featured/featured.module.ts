import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueName } from '../../core/queue/queue.constants.js';
import { ListingsModule } from '../listings/listings.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { AdminFeaturedController } from './controllers/admin-featured.controller.js';
import { ListingFeatureController } from './controllers/listing-feature.controller.js';
import { FeaturedPlan } from './entities/featured-plan.entity.js';
import { ListingFeature } from './entities/listing-feature.entity.js';
import { FEATURED_REPOSITORY } from './interfaces/featured-repository.interface.js';
import { FeaturedEventsListener } from './listeners/featured-events.listener.js';
import { FeaturedLifecycleProcessor } from './processors/featured-lifecycle.processor.js';
import { TypeOrmFeaturedRepository } from './repositories/featured.repository.js';
import { FeaturedPlansService } from './services/featured-plans.service.js';
import { ListingFeaturesService } from './services/listing-features.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeaturedPlan, ListingFeature]),
    BullModule.registerQueue({ name: QueueName.FeaturedLifecycle }),
    ListingsModule,
    PaymentsModule,
  ],
  controllers: [ListingFeatureController, AdminFeaturedController],
  providers: [
    FeaturedPlansService,
    ListingFeaturesService,
    FeaturedEventsListener,
    FeaturedLifecycleProcessor,
    { provide: FEATURED_REPOSITORY, useClass: TypeOrmFeaturedRepository },
  ],
  exports: [ListingFeaturesService],
})
export class FeaturedModule {}
