import type { Review } from '../entities/review.entity.js';

export const REVIEWS_REPOSITORY = Symbol('REVIEWS_REPOSITORY');

export interface RatingAggregate {
  average: number | null;
  count: number;
}

export interface ReviewsRepository {
  upsert(
    listingId: string,
    authorId: string,
    rating: number,
    comment: string | null,
  ): Promise<Review>;
  delete(listingId: string, authorId: string): Promise<boolean>;
  findMine(listingId: string, authorId: string): Promise<Review | null>;
  /** Newest first, with authors. */
  latest(listingId: string, limit: number): Promise<Review[]>;
  aggregate(listingId: string): Promise<RatingAggregate>;
}
