import type {
  AuthSessionResponse,
  BecomeListerInput,
  SendOtpInput,
  UpdateProfileInput,
  UserResponse,
  VerifyOtpInput,
} from '@housingcom/contracts';
import { baseApi } from '@/shared/api/base-api';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    sendOtp: build.mutation<void, SendOtpInput>({
      query: (body) => ({ url: '/auth/otp/send', method: 'POST', body }),
    }),
    verifyOtp: build.mutation<AuthSessionResponse, VerifyOtpInput>({
      query: (body) => ({ url: '/auth/otp/verify', method: 'POST', body }),
    }),
    logout: build.mutation<void, { refreshToken: string }>({
      query: (body) => ({ url: '/auth/logout', method: 'POST', body }),
    }),
    me: build.query<UserResponse, void>({
      query: () => '/users/me',
      providesTags: ['Me'],
    }),
    updateMe: build.mutation<UserResponse, UpdateProfileInput>({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      invalidatesTags: ['Me'],
    }),
    becomeLister: build.mutation<UserResponse, BecomeListerInput>({
      query: (body) => ({ url: '/users/me/lister', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
  }),
});

export const {
  useSendOtpMutation,
  useLogoutMutation,
  useMeQuery,
  useUpdateMeMutation,
  useBecomeListerMutation,
} = authApi;
