import type { AreaResponse, CityResponse } from '@housingcom/contracts';
import { fromPoint } from '../../../core/utils/geo.util.js';
import type { Area } from '../entities/area.entity.js';
import type { City } from '../entities/city.entity.js';

export const toCityResponse = (city: City): CityResponse => ({
  id: city.id,
  name: city.name,
  state: city.state,
  slug: city.slug,
  center: fromPoint(city.center),
});

export const toAreaResponse = (area: Area, distanceKm?: number): AreaResponse => ({
  id: area.id,
  cityId: area.cityId,
  name: area.name,
  slug: area.slug,
  center: fromPoint(area.center),
  isPopular: area.isPopular,
  ...(distanceKm !== undefined ? { distanceKm: Math.round(distanceKm * 100) / 100 } : {}),
});
