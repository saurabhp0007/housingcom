import type {
  BrowseListingsQuery,
  CreateListingInput,
  ListingCardResponse,
  ListingDetailResponse,
  ListingMediaResponse,
  ListingStatus,
  MyListingResponse,
  Paginated,
  UpdateListingInput,
} from '@housingcom/contracts';
import { baseApi } from '@/shared/api/base-api';

type Lifecycle = 'submit' | 'pause' | 'resume' | 'mark-filled';

export const listingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ── Public ────────────────────────────────────────────
    browseListings: build.query<Paginated<ListingCardResponse>, Partial<BrowseListingsQuery>>({
      query: (params) => ({ url: '/listings', params }),
      providesTags: ['Listing'],
    }),
    listing: build.query<ListingDetailResponse, string>({
      query: (id) => `/listings/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Listing', id }],
    }),

    // ── Lister ────────────────────────────────────────────
    myListings: build.query<MyListingResponse[], ListingStatus | void>({
      query: (status) => ({ url: '/me/listings', params: status ? { status } : undefined }),
      providesTags: ['MyListings'],
    }),
    myListing: build.query<ListingDetailResponse, string>({
      query: (id) => `/me/listings/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Listing', id }],
    }),
    createListing: build.mutation<ListingDetailResponse, CreateListingInput>({
      query: (body) => ({ url: '/me/listings', method: 'POST', body }),
      invalidatesTags: ['MyListings'],
    }),
    updateListing: build.mutation<ListingDetailResponse, { id: string; body: UpdateListingInput }>({
      query: ({ id, body }) => ({ url: `/me/listings/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => ['MyListings', { type: 'Listing', id }],
    }),
    listingLifecycle: build.mutation<ListingDetailResponse, { id: string; action: Lifecycle }>({
      query: ({ id, action }) => ({ url: `/me/listings/${id}/${action}`, method: 'POST' }),
      invalidatesTags: (_r, _e, { id }) => ['MyListings', 'Listing', { type: 'Listing', id }],
    }),
    deleteListing: build.mutation<void, string>({
      query: (id) => ({ url: `/me/listings/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MyListings', 'Listing'],
    }),
    reorderMedia: build.mutation<ListingMediaResponse[], { id: string; mediaIds: string[] }>({
      query: ({ id, mediaIds }) => ({
        url: `/me/listings/${id}/media/order`,
        method: 'PATCH',
        body: { mediaIds },
      }),
      invalidatesTags: (_r, _e, { id }) => ['MyListings', { type: 'Listing', id }],
    }),
    deleteMedia: build.mutation<void, { id: string; mediaId: string }>({
      query: ({ id, mediaId }) => ({
        url: `/me/listings/${id}/media/${mediaId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { id }) => ['MyListings', { type: 'Listing', id }],
    }),
  }),
});

export const {
  useBrowseListingsQuery,
  useListingQuery,
  useMyListingsQuery,
  useMyListingQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useListingLifecycleMutation,
  useDeleteListingMutation,
  useReorderMediaMutation,
  useDeleteMediaMutation,
} = listingsApi;
