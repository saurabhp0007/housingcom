import { Inject, Injectable } from '@nestjs/common';
import type { ListingEventType, RecommendationWeights } from '@housingcom/contracts';
import { CacheService } from '../../../core/redis/cache.service.js';
import {
  RECOMMENDATIONS_REPOSITORY,
  type RecommendationsRepository,
} from '../interfaces/recommendations-repository.interface.js';
import {
  buildAffinityProfile,
  DEFAULT_WEIGHTS,
  EMPTY_PROFILE,
  normaliseWeights,
  type AffinityProfile,
} from '../policies/ranking.policy.js';

const WEIGHTS_KEY = 'reco:weights:v1';
const profileKey = (userId: string) => `reco:profile:v1:${userId}`;
const ACTIVITY_WINDOW_DAYS = 90;
const ACTIVITY_LIMIT = 300;

/** Inputs to ranking: admin weights and per-user interest profiles (cached in Redis). */
@Injectable()
export class RecommendationsService {
  constructor(
    @Inject(RECOMMENDATIONS_REPOSITORY) private readonly repo: RecommendationsRepository,
    private readonly cache: CacheService,
  ) {}

  /** Raw (admin-entered) weights. */
  async getWeights(): Promise<RecommendationWeights> {
    return this.cache.wrap(
      WEIGHTS_KEY,
      300,
      async () => (await this.repo.getWeights()) ?? DEFAULT_WEIGHTS,
    );
  }

  /** Weights normalised to sum to 1, as used by the ranking query. */
  async rankingWeights(): Promise<RecommendationWeights> {
    return normaliseWeights(await this.getWeights());
  }

  async updateWeights(
    weights: RecommendationWeights,
    adminId: string,
  ): Promise<RecommendationWeights> {
    await this.repo.saveWeights(weights, adminId);
    await this.cache.del(WEIGHTS_KEY);
    return this.getWeights();
  }

  async profile(userId: string | undefined): Promise<AffinityProfile> {
    if (!userId) return EMPTY_PROFILE;
    return this.cache.wrap(profileKey(userId), 600, async () =>
      buildAffinityProfile(
        await this.repo.recentActivity(userId, ACTIVITY_WINDOW_DAYS, ACTIVITY_LIMIT),
      ),
    );
  }

  /** Records an action and refreshes the user's profile on their next request. */
  async track(userId: string, listingId: string, type: ListingEventType): Promise<void> {
    await this.repo.track(userId, listingId, type);
    await this.cache.del(profileKey(userId));
  }
}
