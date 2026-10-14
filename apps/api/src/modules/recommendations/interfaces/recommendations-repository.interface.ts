import type { ListingEventType, RecommendationWeights } from '@housingcom/contracts';
import type { ActivityRow } from '../policies/ranking.policy.js';

export const RECOMMENDATIONS_REPOSITORY = Symbol('RECOMMENDATIONS_REPOSITORY');

export interface RecommendationsRepository {
  getWeights(): Promise<RecommendationWeights | null>;
  saveWeights(weights: RecommendationWeights, updatedBy: string): Promise<void>;
  track(userId: string, listingId: string, type: ListingEventType): Promise<void>;
  /** Recent activity joined to the listing's type/area/rent. */
  recentActivity(userId: string, sinceDays: number, limit: number): Promise<ActivityRow[]>;
}
