import type { AppConfigResponse, Platform } from '@housingcom/contracts';
import { baseApi } from '@/shared/api/base-api';

export const appConfigApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    appConfig: build.query<AppConfigResponse, Platform>({
      query: (platform) => ({ url: '/app-config', params: { platform } }),
      providesTags: ['AppConfig'],
    }),
  }),
});

export const { useAppConfigQuery } = appConfigApi;
