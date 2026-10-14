import type {
  ContactChannel,
  ContactOwnerResponse,
  LeadResponse,
  ListingCardResponse,
  Paginated,
  ReportListingInput,
  RequestVisitInput,
  RespondVisitInput,
  ReviewInput,
  ReviewResponse,
  ReviewSummaryResponse,
  SavedSearchInput,
  SavedSearchResponse,
  VisitResponse,
} from '@housingcom/contracts';
import { baseApi } from '@/shared/api/base-api';

const PAGE_SIZE = 20;
const nextPage = (last: Paginated<unknown>) =>
  last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined;

/** Customer ↔ owner engagement: favourites, contact, visits, reviews, reports, saved searches. */
export const engagementApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ── Favourites ────────────────────────────────────────
    favoriteIds: build.query<string[], void>({
      query: () => '/me/favorites/ids',
      providesTags: ['Favorites'],
    }),
    favorites: build.infiniteQuery<Paginated<ListingCardResponse>, void, number>({
      infiniteQueryOptions: { initialPageParam: 1, getNextPageParam: nextPage },
      query: ({ pageParam }) => ({
        url: '/me/favorites',
        params: { page: pageParam, limit: PAGE_SIZE },
      }),
      providesTags: ['Favorites'],
    }),
    setFavorite: build.mutation<void, { listingId: string; saved: boolean }>({
      query: ({ listingId, saved }) => ({
        url: `/me/favorites/${listingId}`,
        method: saved ? 'PUT' : 'DELETE',
      }),
      // Optimistic heart: flip the id list now, roll back if the request fails.
      async onQueryStarted({ listingId, saved }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          engagementApi.util.updateQueryData('favoriteIds', undefined, (ids) => {
            const without = ids.filter((id) => id !== listingId);
            return saved ? [listingId, ...without] : without;
          }),
        );
        try {
          await queryFulfilled;
          dispatch(engagementApi.util.invalidateTags(['Favorites']));
        } catch {
          patch.undo();
        }
      },
    }),

    // ── Contact & visits ──────────────────────────────────
    contactOwner: build.mutation<
      ContactOwnerResponse,
      { listingId: string; channel: ContactChannel }
    >({
      query: ({ listingId, channel }) => ({
        url: `/listings/${listingId}/contact`,
        method: 'POST',
        body: { channel },
      }),
      invalidatesTags: (r) => (r?.conversationId ? ['Conversations', 'Reviews'] : ['Reviews']),
    }),
    requestVisit: build.mutation<VisitResponse, { listingId: string; body: RequestVisitInput }>({
      query: ({ listingId, body }) => ({
        url: `/listings/${listingId}/visits`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Visits', 'Reviews'],
    }),
    myVisits: build.query<Paginated<VisitResponse>, void>({
      query: () => ({ url: '/me/visits', params: { limit: 50 } }),
      providesTags: ['Visits'],
    }),
    cancelVisit: build.mutation<VisitResponse, string>({
      query: (id) => ({ url: `/me/visits/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['Visits'],
    }),

    // ── Lister leads ──────────────────────────────────────
    leads: build.infiniteQuery<Paginated<LeadResponse>, void, number>({
      infiniteQueryOptions: { initialPageParam: 1, getNextPageParam: nextPage },
      query: ({ pageParam }) => ({
        url: '/me/leads',
        params: { page: pageParam, limit: PAGE_SIZE },
      }),
      providesTags: ['Leads'],
    }),
    respondVisit: build.mutation<VisitResponse, { id: string; body: RespondVisitInput }>({
      query: ({ id, body }) => ({ url: `/me/leads/visits/${id}/respond`, method: 'POST', body }),
      invalidatesTags: ['Leads'],
    }),

    // ── Reviews ───────────────────────────────────────────
    reviews: build.query<ReviewSummaryResponse, string>({
      query: (listingId) => `/listings/${listingId}/reviews`,
      providesTags: (_r, _e, id) => [{ type: 'Reviews', id }, 'Reviews'],
    }),
    saveReview: build.mutation<ReviewResponse, { listingId: string; body: ReviewInput }>({
      query: ({ listingId, body }) => ({
        url: `/listings/${listingId}/reviews/me`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { listingId }) => [
        { type: 'Reviews', id: listingId },
        { type: 'Listing', id: listingId },
      ],
    }),
    deleteReview: build.mutation<void, string>({
      query: (listingId) => ({ url: `/listings/${listingId}/reviews/me`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Reviews', id },
        { type: 'Listing', id },
      ],
    }),

    // ── Reports ───────────────────────────────────────────
    reportListing: build.mutation<void, { listingId: string; body: ReportListingInput }>({
      query: ({ listingId, body }) => ({
        url: `/listings/${listingId}/reports`,
        method: 'POST',
        body,
      }),
    }),

    // ── Saved searches ────────────────────────────────────
    savedSearches: build.query<SavedSearchResponse[], void>({
      query: () => '/me/saved-searches',
      providesTags: ['SavedSearches'],
    }),
    createSavedSearch: build.mutation<SavedSearchResponse, SavedSearchInput>({
      query: (body) => ({ url: '/me/saved-searches', method: 'POST', body }),
      invalidatesTags: ['SavedSearches'],
    }),
    updateSavedSearch: build.mutation<SavedSearchResponse, { id: string; body: SavedSearchInput }>({
      query: ({ id, body }) => ({ url: `/me/saved-searches/${id}`, method: 'PUT', body }),
      invalidatesTags: ['SavedSearches'],
    }),
    deleteSavedSearch: build.mutation<void, string>({
      query: (id) => ({ url: `/me/saved-searches/${id}`, method: 'DELETE' }),
      invalidatesTags: ['SavedSearches'],
    }),
  }),
});

export const {
  useFavoriteIdsQuery,
  useFavoritesInfiniteQuery,
  useSetFavoriteMutation,
  useContactOwnerMutation,
  useRequestVisitMutation,
  useMyVisitsQuery,
  useCancelVisitMutation,
  useLeadsInfiniteQuery,
  useRespondVisitMutation,
  useReviewsQuery,
  useSaveReviewMutation,
  useDeleteReviewMutation,
  useReportListingMutation,
  useSavedSearchesQuery,
  useCreateSavedSearchMutation,
  useUpdateSavedSearchMutation,
  useDeleteSavedSearchMutation,
} = engagementApi;
