import type {
  ListingFilters,
  ListingSort,
  ListingStatus,
  ListingType,
  MapResponse,
  NearbyPlaceCategory,
  Paginated,
  RecommendationWeights,
} from '@housingcom/contracts';
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

export interface SearchParams {
  filters: ListingFilters;
  point?: { lat: number; lng: number };
  radiusKm: number;
  cityId?: string;
  areaId?: string;
  sort: ListingSort;
  page: number;
  limit: number;
  /** Ranking inputs (sort = recommended). */
  weights: RecommendationWeights;
  affinity: { types: Record<string, number>; areas: Record<string, number> };
  budget: number | null;
}

export interface MapParams {
  filters: ListingFilters;
  bbox: { minLat: number; minLng: number; maxLat: number; maxLng: number };
  /** Above this many listings in view, return grid clusters instead of pins. */
  maxPins: number;
}

export interface NearbyPlaceRow {
  category: NearbyPlaceCategory;
  name: string;
  distanceM: number;
}

export interface ListingsRepository {
  create(data: DeepPartial<Listing>): Promise<Listing>;
  findById(id: string): Promise<Listing | null>;
  findRow(id: string): Promise<ListingRow | null>;
  update(id: string, data: DeepPartial<Listing>): Promise<void>;
  softDelete(id: string): Promise<void>;
  findByOwner(ownerId: string, status?: ListingStatus): Promise<ListingRow[]>;
  findByStatus(status: ListingStatus, page: number, limit: number): Promise<Paginated<ListingRow>>;
  incrementViews(id: string): Promise<void>;
  countByStatus(): Promise<Partial<Record<ListingStatus, number>>>;
  countByOwner(ownerIds: string[]): Promise<Map<string, number>>;

  // ── Phase 3: search, map, similar, nearby places ──
  search(params: SearchParams): Promise<Paginated<ListingRow>>;
  map(params: MapParams): Promise<MapResponse>;
  similar(listing: Listing, limit: number): Promise<ListingRow[]>;
  findNearbyPlaces(listingId: string): Promise<NearbyPlaceRow[]>;
  replaceNearbyPlaces(listingId: string, places: NearbyPlaceRow[]): Promise<void>;
}
