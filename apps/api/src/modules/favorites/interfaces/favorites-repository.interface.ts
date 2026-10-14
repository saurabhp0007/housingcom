import type { Paginated } from '@housingcom/contracts';

export const FAVORITES_REPOSITORY = Symbol('FAVORITES_REPOSITORY');

export interface FavoritesRepository {
  /** Returns true when the row was created (false if it already existed). */
  add(userId: string, listingId: string): Promise<boolean>;
  remove(userId: string, listingId: string): Promise<void>;
  /** Newest first. */
  pageListingIds(userId: string, page: number, limit: number): Promise<Paginated<string>>;
  allListingIds(userId: string): Promise<string[]>;
}
