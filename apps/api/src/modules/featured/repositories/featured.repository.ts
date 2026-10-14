import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { FeatureStatus, type Paginated } from '@housingcom/contracts';
import { buildPaginationMeta } from '../../../core/utils/pagination.util.js';
import { FeaturedPlan } from '../entities/featured-plan.entity.js';
import { ListingFeature } from '../entities/listing-feature.entity.js';
import type {
  FeaturedRepository,
  NewFeature,
  PlanData,
} from '../interfaces/featured-repository.interface.js';

const OPEN = [FeatureStatus.Active, FeatureStatus.Paused];

@Injectable()
export class TypeOrmFeaturedRepository implements FeaturedRepository {
  constructor(
    @InjectRepository(FeaturedPlan) private readonly plans: Repository<FeaturedPlan>,
    @InjectRepository(ListingFeature) private readonly features: Repository<ListingFeature>,
  ) {}

  allPlans(): Promise<FeaturedPlan[]> {
    return this.plans.find({
      relations: { city: true, area: true },
      order: { sortOrder: 'ASC', durationDays: 'ASC' },
    });
  }

  findPlan(id: string): Promise<FeaturedPlan | null> {
    return this.plans.findOne({ where: { id }, relations: { city: true, area: true } });
  }

  async createPlan(data: PlanData): Promise<FeaturedPlan> {
    const plan = await this.plans.save(this.plans.create(data));
    return (await this.findPlan(plan.id))!;
  }

  async updatePlan(id: string, data: Partial<PlanData>): Promise<FeaturedPlan> {
    await this.plans.update({ id }, data);
    return (await this.findPlan(id))!;
  }

  findFeature(id: string): Promise<ListingFeature | null> {
    return this.features.findOneBy({ id });
  }

  findOpen(listingId: string): Promise<ListingFeature | null> {
    return this.features.findOneBy({ listingId, status: In(OPEN) });
  }

  createFeature(data: NewFeature): Promise<ListingFeature> {
    return this.features.save(this.features.create({ ...data, status: FeatureStatus.Active }));
  }

  async updateFeature(id: string, data: Partial<ListingFeature>): Promise<void> {
    await this.features.update({ id }, data);
  }

  countActiveInArea(areaId: string, excludeListingId: string): Promise<number> {
    return this.features.countBy({
      areaId,
      status: FeatureStatus.Active,
      listingId: Not(excludeListingId),
    });
  }

  countActive(): Promise<number> {
    return this.features.countBy({ status: FeatureStatus.Active });
  }

  forOwner(ownerId: string): Promise<ListingFeature[]> {
    return this.features.find({ where: { ownerId }, order: { createdAt: 'DESC' }, take: 100 });
  }

  async page(
    status: FeatureStatus,
    page: number,
    limit: number,
  ): Promise<Paginated<ListingFeature>> {
    const [items, total] = await this.features.findAndCount({
      where: { status },
      order: { endsAt: status === FeatureStatus.Active ? 'ASC' : 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async increment(listingIds: string[], counter: 'impressions' | 'views' | 'leads'): Promise<void> {
    if (listingIds.length === 0) return;
    await this.features
      .createQueryBuilder()
      .update()
      .set({ [counter]: () => `${counter} + 1` })
      .where('listing_id IN (:...listingIds)', { listingIds })
      .andWhere('status = :active', { active: FeatureStatus.Active })
      .andWhere('ends_at > now()')
      .execute();
  }
}
