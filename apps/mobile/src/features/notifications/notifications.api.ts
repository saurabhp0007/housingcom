import type {
  BroadcastInput,
  BroadcastResponse,
  NotificationResponse,
  Paginated,
  Platform,
} from '@housingcom/contracts';
import { baseApi } from '@/shared/api/base-api';

export interface RegisterDeviceInput {
  id: string;
  platform: Platform;
  pushToken?: string;
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    notifications: build.infiniteQuery<Paginated<NotificationResponse>, void, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (last) =>
          last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
      },
      query: ({ pageParam }) => ({
        url: '/me/notifications',
        params: { page: pageParam, limit: 30 },
      }),
      providesTags: ['Notifications'],
    }),
    notificationsUnreadCount: build.query<{ count: number }, void>({
      query: () => '/me/notifications/unread-count',
      providesTags: ['Notifications'],
    }),
    markNotificationRead: build.mutation<void, string>({
      query: (id) => ({ url: `/me/notifications/${id}/read`, method: 'POST' }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsRead: build.mutation<void, void>({
      query: () => ({ url: '/me/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notifications'],
    }),
    registerDevice: build.mutation<void, RegisterDeviceInput>({
      query: (body) => ({ url: '/users/me/devices', method: 'PUT', body }),
    }),

    // ── Admin ─────────────────────────────────────────────
    broadcasts: build.query<Paginated<BroadcastResponse>, void>({
      query: () => ({ url: '/admin/broadcasts', params: { limit: 30 } }),
      providesTags: ['Broadcasts'],
    }),
    sendBroadcast: build.mutation<BroadcastResponse, BroadcastInput>({
      query: (body) => ({ url: '/admin/broadcasts', method: 'POST', body }),
      invalidatesTags: ['Broadcasts'],
    }),
  }),
});

export const {
  useNotificationsInfiniteQuery,
  useNotificationsUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useRegisterDeviceMutation,
  useBroadcastsQuery,
  useSendBroadcastMutation,
} = notificationsApi;
