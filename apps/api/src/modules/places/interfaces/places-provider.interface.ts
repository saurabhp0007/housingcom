import type { Coordinates, NearbyPlaceCategory, PlaceDetails, PlaceSuggestion } from '@housingcom/contracts';

export const PLACES_PROVIDER = Symbol('PLACES_PROVIDER');

export interface NearestPlace {
  name: string;
  location: Coordinates;
}

/** External places data (Google Places today). Swappable, and a no-op when unconfigured. */
export interface PlacesProvider {
  readonly isEnabled: boolean;
  autocomplete(q: string, bias: Coordinates | undefined, sessionToken: string | undefined): Promise<PlaceSuggestion[]>;
  details(placeId: string, sessionToken: string | undefined): Promise<PlaceDetails | null>;
  nearest(category: NearbyPlaceCategory, point: Coordinates, radiusM: number): Promise<NearestPlace | null>;
}
