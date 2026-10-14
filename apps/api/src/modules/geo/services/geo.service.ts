import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type {
  AreaResponse,
  CityResponse,
  Coordinates,
  ResolvedLocationResponse,
} from '@housingcom/contracts';
import { geoConfig } from '../../../config/configuration.js';
import { AppException } from '../../../core/errors/app.exception.js';
import { CacheService } from '../../../core/redis/cache.service.js';
import { GEO_REPOSITORY, type GeoRepository } from '../interfaces/geo-repository.interface.js';
import { toAreaResponse, toCityResponse } from '../mappers/geo.mapper.js';

export const CITIES_CACHE_KEY = 'geo:cities:v1';
const CITIES_CACHE_TTL_SECONDS = 600;

@Injectable()
export class GeoService {
  constructor(
    @Inject(GEO_REPOSITORY) private readonly geo: GeoRepository,
    @Inject(geoConfig.KEY) private readonly config: ConfigType<typeof geoConfig>,
    private readonly cache: CacheService,
  ) {}

  listCities(): Promise<CityResponse[]> {
    return this.cache.wrap(CITIES_CACHE_KEY, CITIES_CACHE_TTL_SECONDS, async () =>
      (await this.geo.findActiveCities()).map(toCityResponse),
    );
  }

  async listAreas(cityId: string, popularOnly = false): Promise<AreaResponse[]> {
    const city = await this.geo.findCityById(cityId);
    if (!city) throw AppException.notFound('City');
    return (await this.geo.findAreasByCity(cityId, popularOnly)).map((a) => toAreaResponse(a));
  }

  async nearbyAreas(point: Coordinates, radiusKm: number, limit: number): Promise<AreaResponse[]> {
    const rows = await this.geo.findAreasNear(point, radiusKm, limit);
    return rows.map(({ area, distanceKm }) => toAreaResponse(area, distanceKm));
  }

  /**
   * Maps the device location to the nearest serviceable area + city.
   * Drives "auto-detect area" on the home screen.
   */
  async resolve(point: Coordinates): Promise<ResolvedLocationResponse> {
    const [nearest] = await this.geo.findAreasNear(point, this.config.serviceableRadiusKm, 1);
    if (!nearest) return { city: null, area: null, isServiceable: false };

    const city = await this.geo.findCityById(nearest.area.cityId);
    return {
      city: city ? toCityResponse(city) : null,
      area: toAreaResponse(nearest.area, nearest.distanceKm),
      isServiceable: !!city,
    };
  }
}
