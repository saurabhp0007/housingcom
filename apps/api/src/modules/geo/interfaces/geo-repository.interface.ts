import type { Coordinates } from '@housingcom/contracts';
import type { Area } from '../entities/area.entity.js';
import type { City } from '../entities/city.entity.js';

export const GEO_REPOSITORY = Symbol('GEO_REPOSITORY');

export interface AreaWithDistance {
  area: Area;
  distanceKm: number;
}

export interface CityData {
  name: string;
  state: string;
  slug: string;
  center: Coordinates;
  isActive?: boolean;
}

export interface AreaData {
  name: string;
  slug: string;
  center: Coordinates;
  isPopular?: boolean;
  isActive?: boolean;
}

export interface AreaMatch {
  area: Area;
  cityName: string;
}

export interface GeoRepository {
  findActiveCities(): Promise<City[]>;
  findCityById(id: string): Promise<City | null>;
  findAreasByCity(cityId: string, popularOnly: boolean): Promise<Area[]>;
  /** Active areas within radius, nearest first. */
  findAreasNear(point: Coordinates, radiusKm: number, limit: number): Promise<AreaWithDistance[]>;

  /** Typo-tolerant name search over active areas (pg_trgm), best match first. */
  searchAreas(q: string, limit: number): Promise<AreaMatch[]>;

  // Admin
  findAllCities(): Promise<City[]>;
  findAnyCity(id: string): Promise<City | null>;
  findAllAreasByCity(cityId: string): Promise<Area[]>;
  findArea(id: string): Promise<Area | null>;
  createCity(data: CityData): Promise<City>;
  updateCity(id: string, data: Partial<CityData>): Promise<void>;
  createArea(cityId: string, data: AreaData): Promise<Area>;
  updateArea(id: string, data: Partial<AreaData>): Promise<void>;
}
