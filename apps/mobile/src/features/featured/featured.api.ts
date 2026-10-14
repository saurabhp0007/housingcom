import type {
  CheckoutResponse,
  FeatureOptionsResponse,
  FeatureStatus,
  FeaturedPlanInput,
  FeaturedPlanResponse,
  ListingCardResponse,
  ListingFeatureResponse,
  Paginated,
  PaymentResponse,
  PaymentStatus,
  PinListingInput,
  VerifyPaymentInput,
} from '@housingcom/contracts';
import { baseApi } from '@/shared/api/base-api';

/** Featured listings: placement (public), purchase (lister) and management (admin). */
export const featuredApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ── Public ────────────────────────────────────────────
    featuredListings: build.query<
      ListingCardResponse[],
      { lat: number; lng: number; radiusKm?: number }
    >({
      query: (params) => ({ url: '/listings/featured', params: { radiusKm: 10, ...params } }),
      providesTags: ['Featured'],
      // The server rotates featured listings fairly; refresh now and then.
      keepUnusedDataFor: 60,
    }),

    // ── Lister ────────────────────────────────────────────
    featureOptions: build.query<FeatureOptionsResponse, string>({
      query: (listingId) => `/me/listings/${listingId}/feature-options`,
      providesTags: (_r, _e, id) => [{ type: 'Featured', id }],
    }),
    featureCheckout: build.mutation<CheckoutResponse, { listingId: string; planId: string }>({
      query: ({ listingId, planId }) => ({
        url: `/me/listings/${listingId}/feature/checkout`,
        method: 'POST',
        body: { planId },
      }),
    }),
    verifyPayment: build.mutation<PaymentResponse, { paymentId: string; body: VerifyPaymentInput }>(
      {
        query: ({ paymentId, body }) => ({
          url: `/me/payments/${paymentId}/verify`,
          method: 'POST',
          body,
        }),
        invalidatesTags: ['Featured', 'MyListings', 'Payments', 'Listing'],
      },
    ),
    myFeatured: build.query<ListingFeatureResponse[], void>({
      query: () => '/me/featured',
      providesTags: ['Featured'],
    }),
    myPayments: build.query<Paginated<PaymentResponse>, void>({
      query: () => ({ url: '/me/payments', params: { limit: 50 } }),
      providesTags: ['Payments'],
    }),

    // ── Admin ─────────────────────────────────────────────
    adminFeaturedPlans: build.query<FeaturedPlanResponse[], void>({
      query: () => '/admin/featured-plans',
      providesTags: ['FeaturedPlans'],
    }),
    createFeaturedPlan: build.mutation<FeaturedPlanResponse, FeaturedPlanInput>({
      query: (body) => ({ url: '/admin/featured-plans', method: 'POST', body }),
      invalidatesTags: ['FeaturedPlans'],
    }),
    updateFeaturedPlan: build.mutation<
      FeaturedPlanResponse,
      { id: string; body: Partial<FeaturedPlanInput> }
    >({
      query: ({ id, body }) => ({ url: `/admin/featured-plans/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['FeaturedPlans'],
    }),
    adminFeatured: build.query<Paginated<ListingFeatureResponse>, { status: FeatureStatus }>({
      query: (params) => ({ url: '/admin/featured', params: { ...params, limit: 50 } }),
      providesTags: ['Featured'],
    }),
    adminFeatureAction: build.mutation<
      ListingFeatureResponse,
      { id: string; action: 'pause' | 'resume' | 'remove' }
    >({
      query: ({ id, action }) => ({ url: `/admin/featured/${id}/${action}`, method: 'POST' }),
      invalidatesTags: ['Featured', 'AdminDashboard', 'Listing'],
    }),
    pinListing: build.mutation<
      ListingFeatureResponse,
      { listingId: string; body: PinListingInput }
    >({
      query: ({ listingId, body }) => ({
        url: `/admin/listings/${listingId}/feature`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Featured', 'AdminDashboard', 'Listing'],
    }),
    adminPayments: build.query<Paginated<PaymentResponse>, { status?: PaymentStatus }>({
      query: (params) => ({ url: '/admin/payments', params: { ...params, limit: 50 } }),
      providesTags: ['Payments'],
    }),
  }),
});

export const {
  useFeaturedListingsQuery,
  useFeatureOptionsQuery,
  useFeatureCheckoutMutation,
  useVerifyPaymentMutation,
  useMyFeaturedQuery,
  useMyPaymentsQuery,
  useAdminFeaturedPlansQuery,
  useCreateFeaturedPlanMutation,
  useUpdateFeaturedPlanMutation,
  useAdminFeaturedQuery,
  useAdminFeatureActionMutation,
  usePinListingMutation,
  useAdminPaymentsQuery,
} = featuredApi;
