import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingsModule } from '../listings/listings.module.js';
import { RecommendationsModule } from '../recommendations/recommendations.module.js';
import { FavoritesController } from './controllers/favorites.controller.js';
import { Favorite } from './entities/favorite.entity.js';
import { FAVORITES_REPOSITORY } from './interfaces/favorites-repository.interface.js';
import { TypeOrmFavoritesRepository } from './repositories/favorites.repository.js';
import { FavoritesService } from './services/favorites.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite]), ListingsModule, RecommendationsModule],
  controllers: [FavoritesController],
  providers: [
    FavoritesService,
    { provide: FAVORITES_REPOSITORY, useClass: TypeOrmFavoritesRepository },
  ],
})
export class FavoritesModule {}
