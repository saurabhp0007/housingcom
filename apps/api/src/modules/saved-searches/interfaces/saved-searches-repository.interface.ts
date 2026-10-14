import type { Coordinates, ListingFilters } from '@housingcom/contracts';
import type { SavedSearch } from '../entities/saved-search.entity.js';

export const SAVED_SEARCHES_REPOSITORY = Symbol('SAVED_SEARCHES_REPOSITORY');

export interface SavedSearchData {
  label: string;
  center: Coordinates;
  radiusKm: number;
  filters: ListingFilters;
  alertsEnabled: boolean;
}

export interface SavedSearchesRepository {
  create(userId: string, data: SavedSearchData): Promise<SavedSearch>;
  update(id: string, data: SavedSearchData): Promise<SavedSearch>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<SavedSearch | null>;
  listForUser(userId: string): Promise<SavedSearch[]>;
  countForUser(userId: string): Promise<number>;
  /**
   * Keyset page of alert-enabled searches whose circle contains the point,
   * excluding one user (the listing owner).
   */
  alertCandidates(
    point: Coordinates,
    excludeUserId: string,
    afterId: string | null,
    limit: number,
  ): Promise<SavedSearch[]>;
  /** True if this is the first alert for (search, listing). */
  recordAlert(savedSearchId: string, listingId: string): Promise<boolean>;
}
