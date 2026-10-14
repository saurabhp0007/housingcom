import type {
  AreaResponse,
  CityResponse,
  NearbyAreasQuery,
  ResolveLocationQuery,
  ResolvedLocationResponse,
} from '@housingcom/contracts';
import { baseApi } from '@/shared/api/base-api';

export const geoApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    cities: build.query<CityResponse[], void>({
      query: () => '/geo/cities',
      providesTags: ['Cities'],
      keepUnusedDataFor: 3600,
    }),
    cityAreas: build.query<AreaResponse[], { cityId: string; popular?: boolean }>({
      query: ({ cityId, popular }) => ({ url: `/geo/cities/${cityId}/areas`, params: { popular } }),
      providesTags: ['Areas'],
    }),
    nearbyAreas: build.query<AreaResponse[], Partial<NearbyAreasQuery> & ResolveLocationQuery>({
      query: (params) => ({ url: '/geo/areas/nearby', params }),
    }),
    resolveLocation: build.query<ResolvedLocationResponse, ResolveLocationQuery>({
      query: (params) => ({ url: '/geo/resolve', params }),
    }),
  }),
});

export const {
  useCitiesQuery,
  useCityAreasQuery,
  useNearbyAreasQuery,
  useLazyResolveLocationQuery,
} = geoApi;
