import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LISTING_LIMITS } from '@housingcom/contracts';
import { GeoModule } from '../geo/geo.module.js';
import { UsersModule } from '../users/users.module.js';
import { AdminListingsController } from './controllers/admin-listings.controller.js';
import { ListingsController } from './controllers/listings.controller.js';
import { MyListingsController } from './controllers/my-listings.controller.js';
import { ListingMedia } from './entities/listing-media.entity.js';
import { Listing } from './entities/listing.entity.js';
import { LISTING_MEDIA_REPOSITORY } from './interfaces/listing-media-repository.interface.js';
import { LISTINGS_REPOSITORY } from './interfaces/listings-repository.interface.js';
import { ListingEventsListener } from './listeners/listing-events.listener.js';
import { ListingMapper } from './mappers/listing.mapper.js';
import { TypeOrmListingMediaRepository } from './repositories/listing-media.repository.js';
import { TypeOrmListingsRepository } from './repositories/listings.repository.js';
import { ListingDetailsService } from './services/listing-details.service.js';
import { ListingMediaService } from './services/listing-media.service.js';
import { ListingModerationService } from './services/listing-moderation.service.js';
import { ListingsQueryService } from './services/listings-query.service.js';
import { ListingsStatsService } from './services/listings-stats.service.js';
import { ListingsService } from './services/listings.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Listing, ListingMedia]),
    MulterModule.register({ limits: { fileSize: LISTING_LIMITS.maxVideoBytes, files: 1 } }),
    UsersModule,
    GeoModule,
  ],
  controllers: [MyListingsController, ListingsController, AdminListingsController],
  providers: [
    { provide: LISTINGS_REPOSITORY, useClass: TypeOrmListingsRepository },
    { provide: LISTING_MEDIA_REPOSITORY, useClass: TypeOrmListingMediaRepository },
    ListingMapper,
    ListingDetailsService,
    ListingsService,
    ListingMediaService,
    ListingsQueryService,
    ListingModerationService,
    ListingsStatsService,
    ListingEventsListener,
  ],
  exports: [ListingsStatsService],
})
export class ListingsModule {}
