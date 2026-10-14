import { Inject, Injectable } from '@nestjs/common';
import type { ReviewInput, ReviewResponse, ReviewSummaryResponse } from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import { LeadsService } from '../../leads/services/leads.service.js';
import { ListingCatalogService } from '../../listings/services/listing-catalog.service.js';
import {
  REVIEWS_REPOSITORY,
  type ReviewsRepository,
} from '../interfaces/reviews-repository.interface.js';
import { toReviewResponse } from '../mappers/review.mapper.js';

const LATEST_LIMIT = 20;

/**
 * Ratings and reviews. Only customers who actually contacted the owner (or asked to visit)
 * can review, which keeps drive-by and competitor reviews out without extra moderation.
 */
@Injectable()
export class ReviewsService {
  constructor(
    @Inject(REVIEWS_REPOSITORY) private readonly reviews: ReviewsRepository,
    private readonly catalog: ListingCatalogService,
    private readonly leads: LeadsService,
  ) {}

  async summary(listingId: string, viewerId: string | undefined): Promise<ReviewSummaryResponse> {
    const listing = await this.catalog.get(listingId);
    const [items, mine, canReview] = await Promise.all([
      this.reviews.latest(listingId, LATEST_LIMIT),
      viewerId ? this.reviews.findMine(listingId, viewerId) : null,
      viewerId && viewerId !== listing.ownerId
        ? this.leads.hasContacted(listingId, viewerId)
        : false,
    ]);
    return {
      average: listing.ratingAverage,
      count: listing.ratingCount,
      mine: mine ? toReviewResponse(mine) : null,
      canReview,
      items: items.map(toReviewResponse),
    };
  }

  async upsert(authorId: string, listingId: string, input: ReviewInput): Promise<ReviewResponse> {
    const listing = await this.catalog.getLive(listingId);
    if (listing.ownerId === authorId) {
      throw AppException.badRequest(ErrorCode.CannotEngageOwnListing, 'This is your own listing');
    }
    if (!(await this.leads.hasContacted(listingId, authorId))) {
      throw AppException.forbidden(
        ErrorCode.ReviewNotAllowed,
        'Contact the owner or visit the place before reviewing it',
      );
    }
    const review = await this.reviews.upsert(
      listingId,
      authorId,
      input.rating,
      input.comment || null,
    );
    await this.refreshRating(listingId);
    return toReviewResponse(review);
  }

  async remove(authorId: string, listingId: string): Promise<void> {
    if (await this.reviews.delete(listingId, authorId)) await this.refreshRating(listingId);
  }

  /** Keeps the listing's denormalised rating (used by cards and ranking) in sync. */
  private async refreshRating(listingId: string): Promise<void> {
    const { average, count } = await this.reviews.aggregate(listingId);
    await this.catalog.setRating(listingId, average, count);
  }
}
