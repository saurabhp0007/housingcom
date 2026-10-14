import type { Coordinates } from '@housingcom/contracts';
import type { Area } from '../entities/area.entity.js';
import type { City } from '../entities/city.entity.js';

export const GEO_REPOSITORY = Symbol('GEO_REPOSITORY');

export interface AreaWithDistance {
  area: Area;
  distanceKm: number;
}

export interface GeoRepository {
  findActiveCities(): Promise<City[]>;
  findCityById(id: string): Promise<City | null>;
  findAreasByCity(cityId: string, popularOnly: boolean): Promise<Area[]>;
  /** Active areas within radius, nearest first. */
  findAreasNear(point: Coordinates, radiusKm: number, limit: number): Promise<AreaWithDistance[]>;
}
