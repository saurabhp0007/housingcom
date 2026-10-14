import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Coordinates } from '@housingcom/contracts';
import { toPoint } from '../../../core/utils/geo.util.js';
import { SavedSearchAlert } from '../entities/saved-search-alert.entity.js';
import { SavedSearch } from '../entities/saved-search.entity.js';
import type {
  SavedSearchData,
  SavedSearchesRepository,
} from '../interfaces/saved-searches-repository.interface.js';

const columns = (d: SavedSearchData) => ({
  label: d.label,
  location: toPoint(d.center),
  radiusKm: d.radiusKm,
  filters: d.filters,
  alertsEnabled: d.alertsEnabled,
});

@Injectable()
export class TypeOrmSavedSearchesRepository implements SavedSearchesRepository {
  constructor(
    @InjectRepository(SavedSearch) private readonly searches: Repository<SavedSearch>,
    @InjectRepository(SavedSearchAlert) private readonly alerts: Repository<SavedSearchAlert>,
  ) {}

  create(userId: string, data: SavedSearchData): Promise<SavedSearch> {
    return this.searches.save(this.searches.create({ userId, ...columns(data) }));
  }

  async update(id: string, data: SavedSearchData): Promise<SavedSearch> {
    await this.searches.update({ id }, columns(data));
    return this.searches.findOneByOrFail({ id });
  }

  async delete(id: string): Promise<void> {
    await this.searches.delete({ id });
  }

  findById(id: string): Promise<SavedSearch | null> {
    return this.searches.findOneBy({ id });
  }

  listForUser(userId: string): Promise<SavedSearch[]> {
    return this.searches.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  countForUser(userId: string): Promise<number> {
    return this.searches.countBy({ userId });
  }

  alertCandidates(
    { lat, lng }: Coordinates,
    excludeUserId: string,
    afterId: string | null,
    limit: number,
  ): Promise<SavedSearch[]> {
    const qb = this.searches
      .createQueryBuilder('s')
      .where('s.alerts_enabled = true')
      .andWhere('s.user_id <> :excludeUserId', { excludeUserId })
      .andWhere(
        'ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, s.radius_km * 1000)',
        { lat, lng },
      )
      .orderBy('s.id', 'ASC')
      .limit(limit);
    if (afterId) qb.andWhere('s.id > :afterId', { afterId });
    return qb.getMany();
  }

  async recordAlert(savedSearchId: string, listingId: string): Promise<boolean> {
    const result = await this.alerts
      .createQueryBuilder()
      .insert()
      .values({ savedSearchId, listingId })
      .orIgnore()
      .execute();
    return (result.raw as unknown[]).length > 0;
  }
}
