import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { ApiResponse } from '@housingcom/contracts';
import { env } from '../config/env';
import type { AppDispatch, RootState } from '../store/types';
import { refreshAccessToken } from './token-refresh';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiUrl,
  timeout: 15_000,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).session.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    headers.set('x-app-version', env.appVersion);
    return headers;
  },
});

/**
 * Unwraps the API's { success, data, meta? } envelope. Paginated responses (with `meta`)
 * become the shared `Paginated<T>` shape ({ items, meta }); everything else is just `data`.
 */
const unwrappingBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extra,
) => {
  const result = await rawBaseQuery(args, api, extra);
  if (result.data && typeof result.data === 'object' && 'success' in result.data) {
    const envelope = result.data as ApiResponse<unknown>;
    return {
      ...result,
      data: envelope.meta ? { items: envelope.data, meta: envelope.meta } : envelope.data,
    };
  }
  return result;
};

/** Retries a request once after transparently refreshing an expired access token. */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extra,
) => {
  let result = await unwrappingBaseQuery(args, api, extra);
  const isAuthCall = typeof args !== 'string' && args.url.startsWith('/auth/');

  if (result.error?.status === 401 && !isAuthCall) {
    if (await refreshAccessToken(api.dispatch as AppDispatch)) {
      result = await unwrappingBaseQuery(args, api, extra);
    }
  }
  return result;
};

/** Root API. Feature APIs inject their endpoints with `baseApi.injectEndpoints`. */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Me',
    'Cities',
    'Areas',
    'AppConfig',
    'Listing',
    'MyListings',
    'Verification',
    'AdminQueue',
    'AdminVerifications',
    'AdminUsers',
    'AdminDashboard',
    'AdminGeo',
    'AdminOta',
    'AdminReco',
  ],
  endpoints: () => ({}),
});
