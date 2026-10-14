import { Logger } from '@nestjs/common';
import {
  NearbyPlaceCategory,
  type Coordinates,
  type PlaceDetails,
  type PlaceSuggestion,
} from '@housingcom/contracts';
import type { NearestPlace, PlacesProvider } from '../interfaces/places-provider.interface.js';

const BASE = 'https://places.googleapis.com/v1';
const TIMEOUT_MS = 4000;

/** Google Places types per category (India: metro stations are typed subway_station). */
const TYPES: Record<NearbyPlaceCategory, string[]> = {
  [NearbyPlaceCategory.Metro]: ['subway_station', 'light_rail_station'],
  [NearbyPlaceCategory.BusStop]: ['bus_stop', 'bus_station'],
  [NearbyPlaceCategory.College]: ['university'],
  [NearbyPlaceCategory.Hospital]: ['hospital'],
};

interface AutocompleteResponse {
  suggestions?: {
    placePrediction?: {
      placeId: string;
      structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
      text?: { text: string };
    };
  }[];
}

interface PlaceResponse {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
}

/** Google Places API (New). Failures degrade to "no results" so search never breaks. */
export class GooglePlacesProvider implements PlacesProvider {
  readonly isEnabled = true;
  private readonly logger = new Logger(GooglePlacesProvider.name);

  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async autocomplete(q: string, bias: Coordinates | undefined, sessionToken: string | undefined): Promise<PlaceSuggestion[]> {
    const body = {
      input: q,
      includedRegionCodes: ['in'],
      ...(sessionToken ? { sessionToken } : {}),
      ...(bias ? { locationBias: { circle: { center: { latitude: bias.lat, longitude: bias.lng }, radius: 30000 } } } : {}),
    };
    const res = await this.call<AutocompleteResponse>('/places:autocomplete', { method: 'POST', body });
    return (res?.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => ({
        id: p.placeId,
        source: 'google' as const,
        title: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
        subtitle: p.structuredFormat?.secondaryText?.text ?? null,
        location: null,
      }));
  }

  async details(placeId: string, sessionToken: string | undefined): Promise<PlaceDetails | null> {
    const qs = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : '';
    const p = await this.call<PlaceResponse>(`/places/${encodeURIComponent(placeId)}${qs}`, {
      method: 'GET',
      fieldMask: 'id,displayName,formattedAddress,location',
    });
    if (!p?.location) return null;
    return {
      id: p.id,
      title: p.displayName?.text ?? '',
      address: p.formattedAddress ?? null,
      location: { lat: p.location.latitude, lng: p.location.longitude },
    };
  }

  async nearest(category: NearbyPlaceCategory, point: Coordinates, radiusM: number): Promise<NearestPlace | null> {
    const res = await this.call<{ places?: PlaceResponse[] }>('/places:searchNearby', {
      method: 'POST',
      fieldMask: 'places.displayName,places.location',
      body: {
        includedTypes: TYPES[category],
        maxResultCount: 1,
        rankPreference: 'DISTANCE',
        locationRestriction: { circle: { center: { latitude: point.lat, longitude: point.lng }, radius: radiusM } },
      },
    });
    const p = res?.places?.[0];
    return p?.location ? { name: p.displayName?.text ?? '', location: { lat: p.location.latitude, lng: p.location.longitude } } : null;
  }

  private async call<T>(path: string, opts: { method: 'GET' | 'POST'; body?: unknown; fieldMask?: string }): Promise<T | null> {
    try {
      const res = await this.fetchImpl(`${BASE}${path}`, {
        method: opts.method,
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': this.apiKey,
          ...(opts.fieldMask ? { 'x-goog-fieldmask': opts.fieldMask } : {}),
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        this.logger.warn({ status: res.status, path }, 'Google Places request failed');
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      this.logger.warn({ err, path }, 'Google Places request error');
      return null;
    }
  }
}
