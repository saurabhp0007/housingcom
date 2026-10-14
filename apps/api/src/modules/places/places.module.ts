import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { geoConfig } from '../../config/configuration.js';
import { GeoModule } from '../geo/geo.module.js';
import { PlacesController } from './controllers/places.controller.js';
import { PLACES_PROVIDER, type PlacesProvider } from './interfaces/places-provider.interface.js';
import { GooglePlacesProvider } from './providers/google-places.provider.js';
import { NoopPlacesProvider } from './providers/noop-places.provider.js';
import { PlacesService } from './services/places.service.js';

@Module({
  imports: [GeoModule],
  controllers: [PlacesController],
  providers: [
    PlacesService,
    {
      provide: PLACES_PROVIDER,
      inject: [geoConfig.KEY],
      useFactory: (config: ConfigType<typeof geoConfig>): PlacesProvider =>
        config.googlePlacesApiKey
          ? new GooglePlacesProvider(config.googlePlacesApiKey)
          : new NoopPlacesProvider(),
    },
  ],
  exports: [PLACES_PROVIDER],
})
export class PlacesModule {}
