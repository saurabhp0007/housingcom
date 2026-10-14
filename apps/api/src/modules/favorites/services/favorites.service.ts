import { Inject, Injectable } from '@nestjs/common';
import { ListingEventType, type ListingCardResponse, type Paginated } from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import { ListingCatalogService } from '../../listings/services/listing-catalog.service.js';
import { RecommendationsService } from '../../recommendations/services/recommendations.service.js';
import {
  FAVORITES_REPOSITORY,
  type FavoritesRepository,
} from '../interfaces/favorites-repository.interface.js';

@Injectable()
export class FavoritesService {
  constructor(
    @Inject(FAVORITES_REPOSITORY) private readonly favorites: FavoritesRepository,
    private readonly catalog: ListingCatalogService,
    private readonly recommendations: RecommendationsService,
  ) {}

  async save(userId: string, listingId: string): Promise<void> {
    const listing = await this.catalog.getLive(listingId);
    if (listing.ownerId === userId) {
      throw AppException.badRequest(ErrorCode.CannotEngageOwnListing, 'This is your own listing');
    }
    // Saves are a strong interest signal for recommendations; count each listing once.
    if (await this.favorites.add(userId, listingId)) {
      await this.recommendations.track(userId, listingId, ListingEventType.Save);
    }
  }

  remove(userId: string, listingId: string): Promise<void> {
    return this.favorites.remove(userId, listingId);
  }

  /** Saved listings that are still live, newest first. */
  async list(userId: string, page: number, limit: number): Promise<Paginated<ListingCardResponse>> {
    const { items: ids, meta } = await this.favorites.pageListingIds(userId, page, limit);
    const cards = await this.catalog.cards(ids, { liveOnly: true });
    return {
      items: ids.map((id) => cards.get(id)).filter((c): c is ListingCardResponse => !!c),
      meta,
    };
  }

  ids(userId: string): Promise<string[]> {
    return this.favorites.allListingIds(userId);
  }
}
