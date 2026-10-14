import {
  FeatureStatus,
  type FeaturedPlanResponse,
  type ListingCardResponse,
  type ListingFeatureResponse,
} from '@housingcom/contracts';
import type { FeaturedPlan } from '../entities/featured-plan.entity.js';
import type { ListingFeature } from '../entities/listing-feature.entity.js';

export function toPlanResponse(p: FeaturedPlan): FeaturedPlanResponse {
  return {
    id: p.id,
    name: p.name,
    durationDays: p.durationDays,
    priceInr: p.priceInr,
    cityId: p.cityId,
    cityName: p.city?.name ?? null,
    areaId: p.areaId,
    areaName: p.area?.name ?? null,
    maxSlotsPerArea: p.maxSlotsPerArea,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
  };
}

export function toFeatureResponse(
  f: ListingFeature,
  listing: ListingCardResponse,
): ListingFeatureResponse {
  // A lapsed period whose end job hasn't run yet is already over for the user.
  const status =
    f.status === FeatureStatus.Active && f.endsAt.getTime() <= Date.now()
      ? FeatureStatus.Expired
      : f.status;
  return {
    id: f.id,
    listing,
    status,
    source: f.source,
    pinned: f.pinned,
    startsAt: f.startsAt.toISOString(),
    endsAt: f.endsAt.toISOString(),
    impressions: f.impressions,
    views: f.views,
    leads: f.leads,
    planName: f.planName,
  };
}
