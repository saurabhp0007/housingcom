import type { ConversationResponse, MessageResponse, Paginated } from '@housingcom/contracts';
import { baseApi } from '@/shared/api/base-api';

const PAGE = 30;

export const chatApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    conversations: build.query<Paginated<ConversationResponse>, void>({
      query: () => ({ url: '/me/conversations', params: { limit: 50 } }),
      providesTags: ['Conversations'],
    }),
    conversation: build.query<ConversationResponse, string>({
      query: (id) => `/me/conversations/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Conversations', id }],
    }),
    chatUnreadCount: build.query<{ count: number }, void>({
      query: () => '/me/conversations/unread-count',
      providesTags: ['Conversations'],
    }),
    /** Pages go backwards in time: page param = id of the oldest message loaded. */
    messages: build.infiniteQuery<MessageResponse[], string, string | null>({
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (last) => (last.length === PAGE ? last[last.length - 1]!.id : undefined),
      },
      query: ({ queryArg, pageParam }) => ({
        url: `/me/conversations/${queryArg}/messages`,
        params: { limit: PAGE, ...(pageParam ? { before: pageParam } : {}) },
      }),
      providesTags: (_r, _e, id) => [{ type: 'Messages', id }],
    }),
    sendMessage: build.mutation<MessageResponse, { conversationId: string; body: string }>({
      query: ({ conversationId, body }) => ({
        url: `/me/conversations/${conversationId}/messages`,
        method: 'POST',
        body: { body },
      }),
    }),
    markConversationRead: build.mutation<void, string>({
      query: (id) => ({ url: `/me/conversations/${id}/read`, method: 'POST' }),
      invalidatesTags: ['Conversations'],
    }),
  }),
});

export const {
  useConversationsQuery,
  useConversationQuery,
  useChatUnreadCountQuery,
  useMessagesInfiniteQuery,
  useSendMessageMutation,
  useMarkConversationReadMutation,
} = chatApi;
