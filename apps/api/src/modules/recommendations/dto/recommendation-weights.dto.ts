import { IsNumber, Max, Min } from 'class-validator';
import type { RecommendationWeights } from '@housingcom/contracts';

/** Relative importance of each ranking signal (0–1). They are normalised to sum to 1. */
export class RecommendationWeightsDto implements RecommendationWeights {
  /** Closeness to the searched point. */
  @IsNumber() @Min(0) @Max(1) distance: number;
  /** Fit with the user's budget. */
  @IsNumber() @Min(0) @Max(1) match: number;
  /** Similarity to what the user viewed, shared, saved or contacted. */
  @IsNumber() @Min(0) @Max(1) personal: number;
  /** Views and contacts. */
  @IsNumber() @Min(0) @Max(1) popularity: number;
  /** New and recently updated listings. */
  @IsNumber() @Min(0) @Max(1) freshness: number;
}
