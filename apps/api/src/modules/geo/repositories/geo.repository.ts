import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Coordinates } from '@housingcom/contracts';
import { Area } from '../entities/area.entity.js';
import { City } from '../entities/city.entity.js';
import { toPoint } from '../../../core/utils/geo.util.js';
import type {
  AreaData,
  AreaWithDistance,
  CityData,
  GeoRepository,
} from '../interfaces/geo-repository.interface.js';

@Injectable()
export class TypeOrmGeoRepository implements GeoRepository {
  constructor(
    @InjectRepository(City) private readonly cities: Repository<City>,
    @InjectRepository(Area) private readonly areas: Repository<Area>,
  ) {}

  findActiveCities(): Promise<City[]> {
    return this.cities.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  findCityById(id: string): Promise<City | null> {
    return this.cities.findOneBy({ id, isActive: true });
  }

  findAreasByCity(cityId: string, popularOnly: boolean): Promise<Area[]> {
    return this.areas.find({
      where: { cityId, isActive: true, ...(popularOnly ? { isPopular: true } : {}) },
      order: { isPopular: 'DESC', name: 'ASC' },
    });
  }

  /** Uses the GiST index on areas.center via ST_DWithin, then orders by true distance. */
  async findAreasNear(
    { lat, lng }: Coordinates,
    radiusKm: number,
    limit: number,
  ): Promise<AreaWithDistance[]> {
    const origin = 'ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography';
    const { entities, raw } = await this.areas
      .createQueryBuilder('area')
      .addSelect(`ST_Distance(area.center, ${origin})`, 'distance_m')
      .where('area.is_active = true')
      .andWhere(`ST_DWithin(area.center, ${origin}, :radiusM)`)
      .setParameters({ lat, lng, radiusM: radiusKm * 1000 })
      .orderBy('distance_m', 'ASC')
      .limit(limit)
      .getRawAndEntities<{ distance_m: number }>();

    return entities.map((area, i) => ({
      area,
      distanceKm: Number(raw[i]?.distance_m ?? 0) / 1000,
    }));
  }

  findAllCities(): Promise<City[]> {
    return this.cities.find({ order: { name: 'ASC' } });
  }

  findAnyCity(id: string): Promise<City | null> {
    return this.cities.findOneBy({ id });
  }

  findAllAreasByCity(cityId: string): Promise<Area[]> {
    return this.areas.find({ where: { cityId }, order: { name: 'ASC' } });
  }

  findArea(id: string): Promise<Area | null> {
    return this.areas.findOneBy({ id });
  }

  createCity({ center, ...rest }: CityData): Promise<City> {
    return this.cities.save(this.cities.create({ ...rest, center: toPoint(center) }));
  }

  async updateCity(id: string, { center, ...rest }: Partial<CityData>): Promise<void> {
    await this.cities.update({ id }, { ...rest, ...(center ? { center: toPoint(center) } : {}) });
  }

  createArea(cityId: string, { center, ...rest }: AreaData): Promise<Area> {
    return this.areas.save(this.areas.create({ ...rest, cityId, center: toPoint(center) }));
  }

  async updateArea(id: string, { center, ...rest }: Partial<AreaData>): Promise<void> {
    await this.areas.update({ id }, { ...rest, ...(center ? { center: toPoint(center) } : {}) });
  }
}
