import type { ReviewResponse } from '@housingcom/contracts';
import type { Review } from '../entities/review.entity.js';

export function toReviewResponse(r: Review): ReviewResponse {
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    // First name only: reviews are public.
    author: { id: r.authorId, name: r.author?.fullName?.split(' ')[0] ?? null },
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
