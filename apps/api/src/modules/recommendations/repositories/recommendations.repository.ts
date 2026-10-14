import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ListingEventType, RecommendationWeights } from '@housingcom/contracts';
import { ListingActivity } from '../entities/listing-activity.entity.js';
import { RecommendationSettings } from '../entities/recommendation-settings.entity.js';
import type { RecommendationsRepository } from '../interfaces/recommendations-repository.interface.js';
import type { ActivityRow } from '../policies/ranking.policy.js';

@Injectable()
export class TypeOrmRecommendationsRepository implements RecommendationsRepository {
  constructor(
    @InjectRepository(RecommendationSettings) private readonly settings: Repository<RecommendationSettings>,
    @InjectRepository(ListingActivity) private readonly activity: Repository<ListingActivity>,
  ) {}

  async getWeights(): Promise<RecommendationWeights | null> {
    return (await this.settings.findOneBy({ id: 1 }))?.weights ?? null;
  }

  async saveWeights(weights: RecommendationWeights, updatedBy: string): Promise<void> {
    await this.settings.upsert({ id: 1, weights, updatedBy }, { conflictPaths: ['id'] });
  }

  async track(userId: string, listingId: string, type: ListingEventType): Promise<void> {
    await this.activity.insert({ userId, listingId, type });
  }

  async recentActivity(userId: string, sinceDays: number, limit: number): Promise<ActivityRow[]> {
    const rows = await this.activity
      .createQueryBuilder('a')
      .innerJoin('listings', 'l', 'l.id = a.listing_id')
      .select('a.type', 'type')
      .addSelect('l.type', 'listingType')
      .addSelect('l.area_id', 'areaId')
      .addSelect('l.rent', 'rent')
      .where('a.user_id = :userId', { userId })
      .andWhere(`a.created_at > now() - make_interval(days => :days)`, { days: sinceDays })
      .orderBy('a.created_at', 'DESC')
      .limit(limit)
      .getRawMany<ActivityRow>();
    return rows.map((r) => ({ ...r, rent: r.rent === null ? null : Number(r.rent) }));
  }
}
