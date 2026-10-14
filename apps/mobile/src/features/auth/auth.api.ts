import type {
  AuthSessionResponse,
  BecomeListerInput,
  FirebaseLoginInput,
  UpdateProfileInput,
  UserResponse,
} from '@housingcom/contracts';
import { baseApi } from '@/shared/api/base-api';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    loginWithFirebase: build.mutation<AuthSessionResponse, FirebaseLoginInput>({
      query: (body) => ({ url: '/auth/firebase', method: 'POST', body }),
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
  useLoginWithFirebaseMutation,
  useLogoutMutation,
  useMeQuery,
  useUpdateMeMutation,
  useBecomeListerMutation,
} = authApi;
