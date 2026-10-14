import type { Coordinates } from '../schemas/common.schema.js';

export interface CityResponse {
  id: string;
  name: string;
  state: string;
  slug: string;
  center: Coordinates;
}

export interface AreaResponse {
  id: string;
  cityId: string;
  name: string;
  slug: string;
  center: Coordinates;
  isPopular: boolean;
  /** Present on proximity queries. */
  distanceKm?: number;
}

export interface ResolvedLocationResponse {
  city: CityResponse | null;
  area: AreaResponse | null;
  isServiceable: boolean;
}
