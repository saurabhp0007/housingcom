import type { MyVerificationResponse } from '@housingcom/contracts';
import { baseApi } from '@/shared/api/base-api';

export const verificationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    myVerification: build.query<MyVerificationResponse, void>({
      query: () => '/me/verification',
      providesTags: ['Verification'],
    }),
  }),
});

export const { useMyVerificationQuery } = verificationApi;
