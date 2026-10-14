import type {
  ListingCardResponse,
  ListingFilters,
  ListingSort,
  MapResponse,
  Paginated,
  PlaceDetails,
  PlaceSuggestion,
} from '@housingcom/contracts';
import { baseApi } from '@/shared/api/base-api';

export interface SearchArgs {
  filters: ListingFilters;
  sort: ListingSort;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export interface MapArgs {
  filters: ListingFilters;
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

/** Filters → query params; arrays are sent comma-separated (the API accepts both forms). */
export function filterParams(f: ListingFilters): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(f)) {
    if (value === undefined || value === '' || value === false) continue;
    if (Array.isArray(value)) {
      if (value.length) out[key] = value.join(',');
    } else out[key] = value as string | number | boolean;
  }
  return out;
}

const PAGE_SIZE = 20;

export const searchApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    searchListings: build.infiniteQuery<Paginated<ListingCardResponse>, SearchArgs, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (last) =>
          last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
      },
      query: ({ queryArg, pageParam }) => ({
        url: '/listings',
        params: {
          ...filterParams(queryArg.filters),
          sort: queryArg.sort,
          ...(queryArg.lat !== undefined
            ? { lat: queryArg.lat, lng: queryArg.lng, radiusKm: queryArg.radiusKm ?? 10 }
            : {}),
          page: pageParam,
          limit: PAGE_SIZE,
        },
      }),
      providesTags: ['Listing'],
    }),
    mapListings: build.query<MapResponse, MapArgs>({
      query: ({ filters, ...bbox }) => ({
        url: '/listings/map',
        params: { ...filterParams(filters), ...bbox },
      }),
      keepUnusedDataFor: 30,
    }),
    similarListings: build.query<ListingCardResponse[], string>({
      query: (id) => `/listings/${id}/similar`,
    }),
    trackShare: build.mutation<void, string>({
      query: (id) => ({ url: `/listings/${id}/events`, method: 'POST', body: { type: 'share' } }),
    }),
    placesAutocomplete: build.query<
      PlaceSuggestion[],
      { q: string; lat?: number; lng?: number; sessionToken: string }
    >({
      query: (params) => ({ url: '/places/autocomplete', params }),
      keepUnusedDataFor: 300,
    }),
    placeDetails: build.query<PlaceDetails, { id: string; sessionToken: string }>({
      query: ({ id, sessionToken }) => ({
        url: `/places/${encodeURIComponent(id)}`,
        params: { sessionToken },
      }),
    }),
  }),
});

export const {
  useSearchListingsInfiniteQuery,
  useMapListingsQuery,
  useSimilarListingsQuery,
  useTrackShareMutation,
  usePlacesAutocompleteQuery,
  useLazyPlaceDetailsQuery,
} = searchApi;
