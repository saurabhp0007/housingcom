import type {
  AdminDashboardResponse,
  ReportResponse,
  ReportStatus,
  AdminUserResponse,
  AreaResponse,
  CityResponse,
  ListingDetailResponse,
  ListingStatus,
  MyListingResponse,
  OtaUpdateResponse,
  Platform,
  UpdateChannel,
  Paginated,
  RecommendationWeights,
  UpsertAreaInput,
  UpsertCityInput,
  UserRole,
  UpdateStatus,
  UserStatus,
  VerificationRequestResponse,
  VerificationStatus,
} from '@housingcom/contracts';
import { baseApi } from '@/shared/api/base-api';

export type AdminCity = CityResponse & { isActive: boolean };
export type AdminArea = AreaResponse & { isActive: boolean };

export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    adminDashboard: build.query<AdminDashboardResponse, void>({
      query: () => '/admin/dashboard',
      providesTags: ['AdminDashboard'],
    }),

    // Listing moderation
    moderationQueue: build.query<
      Paginated<MyListingResponse>,
      { status: ListingStatus; page?: number }
    >({
      query: (params) => ({ url: '/admin/listings', params }),
      providesTags: ['AdminQueue'],
    }),
    adminListing: build.query<ListingDetailResponse, string>({
      query: (id) => `/admin/listings/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Listing', id }],
    }),
    approveListing: build.mutation<ListingDetailResponse, string>({
      query: (id) => ({ url: `/admin/listings/${id}/approve`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        'AdminQueue',
        'AdminDashboard',
        'Listing',
        { type: 'Listing', id },
      ],
    }),
    rejectListing: build.mutation<ListingDetailResponse, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/listings/${id}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        'AdminQueue',
        'AdminDashboard',
        { type: 'Listing', id },
      ],
    }),

    // Verification
    verificationQueue: build.query<
      Paginated<VerificationRequestResponse>,
      { status: VerificationStatus; page?: number }
    >({
      query: (params) => ({ url: '/admin/verifications', params }),
      providesTags: ['AdminVerifications'],
    }),
    adminVerification: build.query<VerificationRequestResponse, string>({
      query: (id) => `/admin/verifications/${id}`,
      providesTags: ['AdminVerifications'],
    }),
    approveVerification: build.mutation<VerificationRequestResponse, string>({
      query: (id) => ({ url: `/admin/verifications/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['AdminVerifications', 'AdminDashboard', 'AdminUsers'],
    }),
    rejectVerification: build.mutation<VerificationRequestResponse, { id: string; reason: string }>(
      {
        query: ({ id, reason }) => ({
          url: `/admin/verifications/${id}/reject`,
          method: 'POST',
          body: { reason },
        }),
        invalidatesTags: ['AdminVerifications', 'AdminDashboard'],
      },
    ),

    // Users
    adminUsers: build.query<
      Paginated<AdminUserResponse>,
      { q?: string; role?: UserRole; status?: UserStatus; page?: number }
    >({
      query: (params) => ({ url: '/admin/users', params }),
      providesTags: ['AdminUsers'],
    }),
    setUserBlocked: build.mutation<AdminUserResponse, { id: string; blocked: boolean }>({
      query: ({ id, blocked }) => ({
        url: `/admin/users/${id}/${blocked ? 'block' : 'unblock'}`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminUsers'],
    }),

    // Recommendation engine
    recommendationWeights: build.query<RecommendationWeights, void>({
      query: () => '/admin/recommendation-settings',
      providesTags: ['AdminReco'],
    }),
    updateRecommendationWeights: build.mutation<RecommendationWeights, RecommendationWeights>({
      query: (body) => ({ url: '/admin/recommendation-settings', method: 'PUT', body }),
      invalidatesTags: ['AdminReco', 'Listing'],
    }),

    // OTA updates
    otaUpdates: build.query<
      Paginated<OtaUpdateResponse>,
      { platform?: Platform; channel?: UpdateChannel }
    >({
      query: (params) => ({ url: '/ota/updates', params: { ...params, limit: 50 } }),
      providesTags: ['AdminOta'],
    }),
    changeOtaUpdate: build.mutation<
      OtaUpdateResponse,
      { id: string; rolloutPercent?: number; status?: UpdateStatus }
    >({
      query: ({ id, ...body }) => ({ url: `/ota/updates/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['AdminOta'],
    }),

    // Cities & areas
    adminCities: build.query<AdminCity[], void>({
      query: () => '/admin/cities',
      providesTags: ['AdminGeo'],
    }),
    adminAreas: build.query<AdminArea[], string>({
      query: (cityId) => `/admin/cities/${cityId}/areas`,
      providesTags: ['AdminGeo'],
    }),
    createCity: build.mutation<AdminCity, UpsertCityInput>({
      query: (body) => ({ url: '/admin/cities', method: 'POST', body }),
      invalidatesTags: ['AdminGeo', 'Cities'],
    }),
    updateCity: build.mutation<AdminCity, { id: string; body: Partial<UpsertCityInput> }>({
      query: ({ id, body }) => ({ url: `/admin/cities/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['AdminGeo', 'Cities'],
    }),
    createArea: build.mutation<AdminArea, { cityId: string; body: UpsertAreaInput }>({
      query: ({ cityId, body }) => ({ url: `/admin/cities/${cityId}/areas`, method: 'POST', body }),
      invalidatesTags: ['AdminGeo', 'Areas'],
    }),
    updateArea: build.mutation<AdminArea, { id: string; body: Partial<UpsertAreaInput> }>({
      query: ({ id, body }) => ({ url: `/admin/areas/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['AdminGeo', 'Areas'],
    }),

    // Reports
    adminReports: build.query<Paginated<ReportResponse>, { status: ReportStatus }>({
      query: (params) => ({ url: '/admin/reports', params: { ...params, limit: 50 } }),
      providesTags: ['AdminReports'],
    }),
    dismissReport: build.mutation<ReportResponse, { id: string; note?: string }>({
      query: ({ id, note }) => ({
        url: `/admin/reports/${id}/dismiss`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: ['AdminReports', 'AdminDashboard'],
    }),
    removeReportedListing: build.mutation<ReportResponse, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/reports/${id}/remove-listing`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['AdminReports', 'AdminDashboard', 'Listing'],
    }),
  }),
});

export const {
  useAdminDashboardQuery,
  useAdminReportsQuery,
  useDismissReportMutation,
  useRemoveReportedListingMutation,
  useModerationQueueQuery,
  useAdminListingQuery,
  useApproveListingMutation,
  useRejectListingMutation,
  useVerificationQueueQuery,
  useAdminVerificationQuery,
  useApproveVerificationMutation,
  useRejectVerificationMutation,
  useAdminUsersQuery,
  useSetUserBlockedMutation,
  useAdminCitiesQuery,
  useAdminAreasQuery,
  useCreateCityMutation,
  useUpdateCityMutation,
  useCreateAreaMutation,
  useUpdateAreaMutation,
  useOtaUpdatesQuery,
  useRecommendationWeightsQuery,
  useUpdateRecommendationWeightsMutation,
  useChangeOtaUpdateMutation,
} = adminApi;
