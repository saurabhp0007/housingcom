import { ListingEventType, type RecommendationWeights } from '@housingcom/contracts';

/** Defaults: location first (PRD §6), then personal fit, popularity and freshness. */
export const DEFAULT_WEIGHTS: RecommendationWeights = {
  distance: 0.35,
  match: 0.1,
  personal: 0.2,
  popularity: 0.2,
  freshness: 0.15,
};

/** How strongly each action signals interest. */
export const EVENT_WEIGHTS: Record<ListingEventType, number> = {
  [ListingEventType.View]: 1,
  [ListingEventType.Share]: 2,
  [ListingEventType.Save]: 3,
  [ListingEventType.Contact]: 4,
};

/** Freshness half-life-ish decay (days) and popularity saturation point. */
export const FRESHNESS_DECAY_DAYS = 14;
export const POPULARITY_SATURATION = 50;
export const CONTACT_POPULARITY_MULTIPLIER = 5;
/** Bayesian prior for ratings: listings start as if they had PRIOR_COUNT reviews of PRIOR_RATING. */
export const RATING_PRIOR = 3.5;
export const RATING_PRIOR_COUNT = 3;
/** Share of "popularity" that comes from ratings vs. views/contacts. */
export const RATING_SHARE_OF_POPULARITY = 0.3;

/** Weights are normalised so they always sum to 1, whatever admins enter. */
export function normaliseWeights(w: RecommendationWeights): RecommendationWeights {
  const sum = w.distance + w.match + w.personal + w.popularity + w.freshness;
  if (sum <= 0) return DEFAULT_WEIGHTS;
  return {
    distance: w.distance / sum,
    match: w.match / sum,
    personal: w.personal / sum,
    popularity: w.popularity / sum,
    freshness: w.freshness / sum,
  };
}

export interface AffinityProfile {
  /** 0..1 per listing type / area, relative to the user's strongest interest. */
  types: Record<string, number>;
  areas: Record<string, number>;
  /** Interest-weighted typical rent, or null with no history. */
  budget: number | null;
}

export const EMPTY_PROFILE: AffinityProfile = { types: {}, areas: {}, budget: null };

export interface ActivityRow {
  type: ListingEventType;
  listingType: string;
  areaId: string | null;
  rent: number | null;
}

/** Builds the user's interest profile from recent activity (pure; unit-tested). */
export function buildAffinityProfile(rows: ActivityRow[]): AffinityProfile {
  if (rows.length === 0) return EMPTY_PROFILE;
  const types: Record<string, number> = {};
  const areas: Record<string, number> = {};
  let budgetWeight = 0;
  let budgetSum = 0;

  for (const r of rows) {
    const w = EVENT_WEIGHTS[r.type] ?? 1;
    types[r.listingType] = (types[r.listingType] ?? 0) + w;
    if (r.areaId) areas[r.areaId] = (areas[r.areaId] ?? 0) + w;
    if (r.rent) {
      budgetSum += r.rent * w;
      budgetWeight += w;
    }
  }

  const normalise = (m: Record<string, number>) => {
    const max = Math.max(...Object.values(m), 0);
    return max > 0
      ? Object.fromEntries(
          Object.entries(m).map(([k, v]) => [k, Math.round((v / max) * 1000) / 1000]),
        )
      : {};
  };

  return {
    types: normalise(types),
    areas: normalise(areas),
    budget: budgetWeight > 0 ? Math.round(budgetSum / budgetWeight) : null,
  };
}
