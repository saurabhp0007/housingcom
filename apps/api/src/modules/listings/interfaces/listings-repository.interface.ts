import type { ListingSort, ListingStatus, ListingType, Paginated } from '@housingcom/contracts';
import type { DeepPartial } from 'typeorm';
import type { Listing } from '../entities/listing.entity.js';

export const LISTINGS_REPOSITORY = Symbol('LISTINGS_REPOSITORY');

/** A listing plus the joined data every card needs (one query, no N+1). */
export interface ListingRow {
  listing: Listing;
  areaName: string | null;
  cityName: string | null;
  isVerifiedLister: boolean;
  coverKey: string | null;
  mediaCount: number;
  distanceKm?: number;
}

export interface BrowseFilter {
  point?: { lat: number; lng: number };
  radiusKm: number;
  cityId?: string;
  areaId?: string;
  type?: ListingType;
  sort: ListingSort;
  page: number;
  limit: number;
}

export interface ListingsRepository {
  create(data: DeepPartial<Listing>): Promise<Listing>;
  findById(id: string): Promise<Listing | null>;
  findRow(id: string): Promise<ListingRow | null>;
  update(id: string, data: DeepPartial<Listing>): Promise<void>;
  softDelete(id: string): Promise<void>;
  findByOwner(ownerId: string, status?: ListingStatus): Promise<ListingRow[]>;
  browseLive(filter: BrowseFilter): Promise<Paginated<ListingRow>>;
  findByStatus(status: ListingStatus, page: number, limit: number): Promise<Paginated<ListingRow>>;
  incrementViews(id: string): Promise<void>;
  countByStatus(): Promise<Partial<Record<ListingStatus, number>>>;
  countByOwner(ownerIds: string[]): Promise<Map<string, number>>;
}
