import { Inject, Injectable } from '@nestjs/common';
import type { FeaturedPlanInput, FeaturedPlanResponse } from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import type { FeaturedPlan } from '../entities/featured-plan.entity.js';
import {
  FEATURED_REPOSITORY,
  type FeaturedRepository,
  type PlanData,
} from '../interfaces/featured-repository.interface.js';
import { toPlanResponse } from '../mappers/featured.mapper.js';
import { applicablePlans } from '../policies/featured.policy.js';

const toData = (i: Partial<FeaturedPlanInput>): Partial<PlanData> => ({
  ...(i.name !== undefined ? { name: i.name } : {}),
  ...(i.durationDays !== undefined ? { durationDays: i.durationDays } : {}),
  ...(i.priceInr !== undefined ? { priceInr: i.priceInr } : {}),
  ...(i.cityId !== undefined ? { cityId: i.cityId } : {}),
  ...(i.areaId !== undefined ? { areaId: i.areaId } : {}),
  ...(i.maxSlotsPerArea !== undefined ? { maxSlotsPerArea: i.maxSlotsPerArea } : {}),
  ...(i.isActive !== undefined ? { isActive: i.isActive } : {}),
  ...(i.sortOrder !== undefined ? { sortOrder: i.sortOrder } : {}),
});

/** Admin-managed featured pricing (PRD §5 "Featured pricing"). */
@Injectable()
export class FeaturedPlansService {
  constructor(@Inject(FEATURED_REPOSITORY) private readonly repo: FeaturedRepository) {}

  async list(): Promise<FeaturedPlanResponse[]> {
    return (await this.repo.allPlans()).map(toPlanResponse);
  }

  async create(input: FeaturedPlanInput): Promise<FeaturedPlanResponse> {
    const data = toData(input) as PlanData;
    return toPlanResponse(
      await this.repo.createPlan({
        ...data,
        cityId: data.cityId ?? null,
        areaId: data.areaId ?? null,
        maxSlotsPerArea: data.maxSlotsPerArea ?? null,
        sortOrder: data.sortOrder ?? 0,
      }),
    );
  }

  async update(id: string, input: Partial<FeaturedPlanInput>): Promise<FeaturedPlanResponse> {
    if (!(await this.repo.findPlan(id))) throw AppException.notFound('Plan');
    return toPlanResponse(await this.repo.updatePlan(id, toData(input)));
  }

  /** Active plans offered for a listing's location. */
  async forListing(listing: {
    cityId: string | null;
    areaId: string | null;
  }): Promise<FeaturedPlan[]> {
    return applicablePlans(await this.repo.allPlans(), listing);
  }
}
