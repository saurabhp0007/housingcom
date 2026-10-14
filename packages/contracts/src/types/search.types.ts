import type { ListingType, NearbyPlaceCategory } from '../enums/listing.enums.js';
import type { Coordinates } from '../schemas/common.schema.js';

/** Map layer: individual pins when zoomed in, server-side clusters when zoomed out. */
export type MapFeature =
  | {
      kind: 'listing';
      id: string;
      location: Coordinates;
      rent: number;
      type: ListingType;
      isVerifiedLister: boolean;
      isFeatured: boolean;
    }
  | { kind: 'cluster'; id: string; location: Coordinates; count: number; minRent: number };

export interface MapResponse {
  features: MapFeature[];
  total: number;
  clustered: boolean;
}

export type PlaceSource = 'area' | 'google';

export interface PlaceSuggestion {
  id: string;
  source: PlaceSource;
  title: string;
  subtitle: string | null;
  /** Present for our own areas; Google suggestions need a details call. */
  location: Coordinates | null;
}

export interface PlaceDetails {
  id: string;
  title: string;
  address: string | null;
  location: Coordinates;
}

export interface NearbyPlaceResponse {
  category: NearbyPlaceCategory;
  name: string;
  distanceKm: number;
}
