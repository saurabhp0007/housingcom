import type {
  BannerInput,
  BannerResponse,
  ContentPageInput,
  ContentPageResponse,
  ContentPageSlug,
  FaqInput,
  FaqResponse,
} from '@housingcom/contracts';
import { baseApi } from '@/shared/api/base-api';

/** FAQs, terms/privacy/about pages and home banners, all edited by admins in the app. */
export const contentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    faqs: build.query<FaqResponse[], void>({
      query: () => '/content/faqs',
      providesTags: ['Content'],
    }),
    contentPage: build.query<ContentPageResponse, ContentPageSlug>({
      query: (slug) => `/content/pages/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: 'Content', id: slug }],
    }),
    banners: build.query<BannerResponse[], { cityId?: string | null }>({
      query: ({ cityId }) => ({ url: '/content/banners', params: cityId ? { cityId } : undefined }),
      providesTags: ['Content'],
    }),

    // ── Admin ─────────────────────────────────────────────
    adminFaqs: build.query<FaqResponse[], void>({
      query: () => '/admin/content/faqs',
      providesTags: ['Content'],
    }),
    saveFaq: build.mutation<FaqResponse, { id?: string; body: Partial<FaqInput> }>({
      query: ({ id, body }) => ({
        url: id ? `/admin/content/faqs/${id}` : '/admin/content/faqs',
        method: id ? 'PATCH' : 'POST',
        body,
      }),
      invalidatesTags: ['Content'],
    }),
    deleteFaq: build.mutation<void, string>({
      query: (id) => ({ url: `/admin/content/faqs/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Content'],
    }),
    savePage: build.mutation<
      ContentPageResponse,
      { slug: ContentPageSlug; body: ContentPageInput }
    >({
      query: ({ slug, body }) => ({ url: `/admin/content/pages/${slug}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { slug }) => [{ type: 'Content', id: slug }],
    }),
    adminBanners: build.query<BannerResponse[], void>({
      query: () => '/admin/content/banners',
      providesTags: ['Content'],
    }),
    saveBanner: build.mutation<BannerResponse, { id?: string; body: Partial<BannerInput> }>({
      query: ({ id, body }) => ({
        url: id ? `/admin/content/banners/${id}` : '/admin/content/banners',
        method: id ? 'PATCH' : 'POST',
        body,
      }),
      invalidatesTags: ['Content'],
    }),
    deleteBanner: build.mutation<void, string>({
      query: (id) => ({ url: `/admin/content/banners/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Content'],
    }),
  }),
});

export const {
  useFaqsQuery,
  useContentPageQuery,
  useBannersQuery,
  useAdminFaqsQuery,
  useSaveFaqMutation,
  useDeleteFaqMutation,
  useSavePageMutation,
  useAdminBannersQuery,
  useSaveBannerMutation,
  useDeleteBannerMutation,
} = contentApi;
