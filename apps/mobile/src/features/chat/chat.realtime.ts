import { ChatSocketEvent, type MessageResponse } from '@housingcom/contracts';
import { io, type Socket } from 'socket.io-client';
import { env } from '@/shared/config/env';
import { refreshAccessToken } from '@/shared/api/token-refresh';
import type { AppDispatch, RootState } from '@/shared/store/types';
import { chatApi } from './chat.api';

/** The thread currently on screen: its messages are marked read and not pushed as banners. */
let activeConversationId: string | null = null;
export const setActiveConversation = (id: string | null) => {
  activeConversationId = id;
};
export const getActiveConversation = () => activeConversationId;

/** Puts a message into the cached thread (newest-first first page), once. */
export function addMessageToCache(dispatch: AppDispatch, message: MessageResponse): void {
  dispatch(
    chatApi.util.updateQueryData('messages', message.conversationId, (draft) => {
      const first = draft.pages[0];
      if (!first) return;
      if (draft.pages.some((p) => p.some((m) => m.id === message.id))) return;
      first.unshift(message);
    }),
  );
}

/**
 * One Socket.IO connection per signed-in session, used only to receive. The token is read
 * on every (re)connect, so refreshed tokens are picked up automatically.
 */
export function createChatSocket(dispatch: AppDispatch, getState: () => RootState): Socket {
  const socket = io(`${env.socketUrl}/chat`, {
    transports: ['websocket'],
    auth: (cb) => cb({ token: getState().session.accessToken }),
    reconnectionDelayMax: 10_000,
  });

  socket.on(ChatSocketEvent.Message, (message: MessageResponse) => {
    addMessageToCache(dispatch, message);
    if (message.conversationId === activeConversationId) {
      void dispatch(chatApi.endpoints.markConversationRead.initiate(message.conversationId));
    } else {
      dispatch(chatApi.util.invalidateTags(['Conversations']));
    }
  });

  // Access token expired while connected: refresh, then reconnect with the new one.
  socket.on('unauthorized', () => {
    void refreshAccessToken(dispatch).then((token) => {
      if (token) socket.connect();
    });
  });

  return socket;
}
