import type { FeatureStatus, Paginated } from '@housingcom/contracts';
import type { FeaturedPlan } from '../entities/featured-plan.entity.js';
import type { ListingFeature } from '../entities/listing-feature.entity.js';

export const FEATURED_REPOSITORY = Symbol('FEATURED_REPOSITORY');

export type PlanData = Pick<
  FeaturedPlan,
  | 'name'
  | 'durationDays'
  | 'priceInr'
  | 'cityId'
  | 'areaId'
  | 'maxSlotsPerArea'
  | 'isActive'
  | 'sortOrder'
>;

export type NewFeature = Pick<
  ListingFeature,
  'listingId' | 'ownerId' | 'areaId' | 'source' | 'pinned' | 'startsAt' | 'endsAt' | 'planName'
>;

export interface FeaturedRepository {
  // Plans
  allPlans(): Promise<FeaturedPlan[]>;
  findPlan(id: string): Promise<FeaturedPlan | null>;
  createPlan(data: PlanData): Promise<FeaturedPlan>;
  updatePlan(id: string, data: Partial<PlanData>): Promise<FeaturedPlan>;

  // Features
  findFeature(id: string): Promise<ListingFeature | null>;
  /** The listing's active or paused period, if any. */
  findOpen(listingId: string): Promise<ListingFeature | null>;
  createFeature(data: NewFeature): Promise<ListingFeature>;
  updateFeature(id: string, data: Partial<ListingFeature>): Promise<void>;
  /** Active periods in an area, other than this listing's own. */
  countActiveInArea(areaId: string, excludeListingId: string): Promise<number>;
  countActive(): Promise<number>;
  forOwner(ownerId: string): Promise<ListingFeature[]>;
  page(status: FeatureStatus, page: number, limit: number): Promise<Paginated<ListingFeature>>;
  /** Counter bumps for running periods only. */
  increment(listingIds: string[], counter: 'impressions' | 'views' | 'leads'): Promise<void>;
}
