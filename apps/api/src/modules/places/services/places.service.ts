import { Inject, Injectable } from '@nestjs/common';
import type { Coordinates, PlaceDetails, PlaceSuggestion } from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { CacheService } from '../../../core/redis/cache.service.js';
import { fromPoint } from '../../../core/utils/geo.util.js';
import {
  GEO_REPOSITORY,
  type GeoRepository,
} from '../../geo/interfaces/geo-repository.interface.js';
import { PLACES_PROVIDER, type PlacesProvider } from '../interfaces/places-provider.interface.js';

const LOCAL_LIMIT = 5;
const TOTAL_LIMIT = 10;

/**
 * "Type any area, landmark, college or office" (PRD §3). Our own areas come first (instant,
 * free, typo tolerant); Google Places adds landmarks, colleges and offices when configured.
 */
@Injectable()
export class PlacesService {
  constructor(
    @Inject(PLACES_PROVIDER) private readonly provider: PlacesProvider,
    @Inject(GEO_REPOSITORY) private readonly geo: GeoRepository,
    private readonly cache: CacheService,
  ) {}

  async autocomplete(
    q: string,
    bias?: Coordinates,
    sessionToken?: string,
  ): Promise<PlaceSuggestion[]> {
    const query = q.trim();
    const local = (await this.geo.searchAreas(query, LOCAL_LIMIT)).map(
      ({ area, cityName }): PlaceSuggestion => ({
        id: area.id,
        source: 'area',
        title: area.name,
        subtitle: cityName,
        location: fromPoint(area.center),
      }),
    );

    // Cache Google results per query and coarse location (~10 km cells) to cut API cost.
    const cell = bias ? `${bias.lat.toFixed(1)},${bias.lng.toFixed(1)}` : 'any';
    const remote = this.provider.isEnabled
      ? await this.cache.wrap(`places:ac:v1:${cell}:${query.toLowerCase()}`, 3600, () =>
          this.provider.autocomplete(query, bias, sessionToken),
        )
      : [];

    const seen = new Set(local.map((l) => l.title.toLowerCase()));
    return [...local, ...remote.filter((r) => !seen.has(r.title.toLowerCase()))].slice(
      0,
      TOTAL_LIMIT,
    );
  }

  async details(placeId: string, sessionToken?: string): Promise<PlaceDetails> {
    const details = await this.cache.wrap(`places:details:v1:${placeId}`, 30 * 86400, () =>
      this.provider.details(placeId, sessionToken),
    );
    if (!details) throw AppException.notFound('Place');
    return details;
  }
}
