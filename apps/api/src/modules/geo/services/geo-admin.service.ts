import { Inject, Injectable } from '@nestjs/common';
import { slugify } from '@housingcom/utils';
import type { AreaResponse, CityResponse, UpsertAreaInput, UpsertCityInput } from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { CacheService } from '../../../core/redis/cache.service.js';
import { GEO_REPOSITORY, type GeoRepository } from '../interfaces/geo-repository.interface.js';
import { toAreaResponse, toCityResponse } from '../mappers/geo.mapper.js';
import { CITIES_CACHE_KEY } from './geo.service.js';

export interface AdminCityResponse extends CityResponse {
  isActive: boolean;
}

export interface AdminAreaResponse extends AreaResponse {
  isActive: boolean;
}

/** Admin management of service cities and areas (PRD §5 "Areas and cities"). */
@Injectable()
export class GeoAdminService {
  constructor(
    @Inject(GEO_REPOSITORY) private readonly geo: GeoRepository,
    private readonly cache: CacheService,
  ) {}

  async cities(): Promise<AdminCityResponse[]> {
    return (await this.geo.findAllCities()).map((c) => ({ ...toCityResponse(c), isActive: c.isActive }));
  }

  async areas(cityId: string): Promise<AdminAreaResponse[]> {
    await this.city(cityId);
    return (await this.geo.findAllAreasByCity(cityId)).map((a) => ({ ...toAreaResponse(a), isActive: a.isActive }));
  }

  async createCity(input: UpsertCityInput): Promise<AdminCityResponse> {
    const city = await this.geo.createCity({
      name: input.name,
      state: input.state,
      slug: slugify(input.name),
      center: { lat: input.lat, lng: input.lng },
      isActive: input.isActive ?? true,
    });
    await this.cache.del(CITIES_CACHE_KEY);
    return { ...toCityResponse(city), isActive: city.isActive };
  }

  async updateCity(id: string, input: Partial<UpsertCityInput>): Promise<AdminCityResponse> {
    await this.city(id);
    await this.geo.updateCity(id, {
      ...(input.name ? { name: input.name, slug: slugify(input.name) } : {}),
      ...(input.state ? { state: input.state } : {}),
      ...(input.lat !== undefined && input.lng !== undefined ? { center: { lat: input.lat, lng: input.lng } } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
    await this.cache.del(CITIES_CACHE_KEY);
    const city = (await this.geo.findAnyCity(id))!;
    return { ...toCityResponse(city), isActive: city.isActive };
  }

  async createArea(cityId: string, input: UpsertAreaInput): Promise<AdminAreaResponse> {
    await this.city(cityId);
    const area = await this.geo.createArea(cityId, {
      name: input.name,
      slug: slugify(input.name),
      center: { lat: input.lat, lng: input.lng },
      isPopular: input.isPopular ?? false,
      isActive: input.isActive ?? true,
    });
    return { ...toAreaResponse(area), isActive: area.isActive };
  }

  async updateArea(id: string, input: Partial<UpsertAreaInput>): Promise<AdminAreaResponse> {
    if (!(await this.geo.findArea(id))) throw AppException.notFound('Area');
    await this.geo.updateArea(id, {
      ...(input.name ? { name: input.name, slug: slugify(input.name) } : {}),
      ...(input.lat !== undefined && input.lng !== undefined ? { center: { lat: input.lat, lng: input.lng } } : {}),
      ...(input.isPopular !== undefined ? { isPopular: input.isPopular } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
    const area = (await this.geo.findArea(id))!;
    return { ...toAreaResponse(area), isActive: area.isActive };
  }

  private async city(id: string) {
    const city = await this.geo.findAnyCity(id);
    if (!city) throw AppException.notFound('City');
    return city;
  }
}
