import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { ApiResponse, AuthTokensResponse } from '@housingcom/contracts';
import { env } from '../config/env';
import { secureStorage } from '../storage/secure-storage';
import type { RootState } from '../store/types';
import { sessionCleared, tokensRefreshed } from '../store/session.slice';

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

/** Unwraps the API's { success, data } envelope so endpoints receive `data` directly. */
const unwrappingBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extra,
) => {
  const result = await rawBaseQuery(args, api, extra);
  if (result.data && typeof result.data === 'object' && 'success' in result.data) {
    return { ...result, data: (result.data as ApiResponse<unknown>).data };
  }
  return result;
};

/** One refresh at a time: concurrent 401s wait for the same refresh call. */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(api: Parameters<BaseQueryFn>[1], extra: object): Promise<boolean> {
  const refreshToken = await secureStorage.getRefreshToken();
  if (!refreshToken) return false;

  const result = await unwrappingBaseQuery(
    { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
    api,
    extra,
  );
  if (!result.data) return false;

  const tokens = result.data as AuthTokensResponse;
  await secureStorage.setRefreshToken(tokens.refreshToken);
  api.dispatch(tokensRefreshed({ accessToken: tokens.accessToken }));
  return true;
}

/** Retries a request once after transparently refreshing an expired access token. */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extra,
) => {
  let result = await unwrappingBaseQuery(args, api, extra);
  const isAuthCall = typeof args !== 'string' && args.url.startsWith('/auth/');

  if (result.error?.status === 401 && !isAuthCall) {
    refreshInFlight ??= refreshSession(api, extra as object).finally(() => {
      refreshInFlight = null;
    });
    if (await refreshInFlight) {
      result = await unwrappingBaseQuery(args, api, extra);
    } else {
      await secureStorage.clearRefreshToken();
      api.dispatch(sessionCleared());
    }
  }
  return result;
};

/** Root API. Feature APIs inject their endpoints with `baseApi.injectEndpoints`. */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Me', 'Cities', 'Areas', 'AppConfig'],
  endpoints: () => ({}),
});
