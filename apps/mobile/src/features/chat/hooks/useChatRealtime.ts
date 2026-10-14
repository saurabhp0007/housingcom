import { useEffect } from 'react';
import { AppState } from 'react-native';
import { store } from '@/shared/store/store';
import { useAppSelector } from '@/shared/store/hooks';
import { chatApi } from '../chat.api';
import { createChatSocket } from '../chat.realtime';

/** Keeps the chat socket open while signed in and the app is in the foreground. */
export function useChatRealtime(): void {
  const signedIn = useAppSelector((s) => s.session.status === 'authenticated');

  useEffect(() => {
    if (!signedIn) return;
    const socket = createChatSocket(store.dispatch, store.getState);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        socket.connect();
        // Catch up on anything missed while backgrounded.
        store.dispatch(chatApi.util.invalidateTags(['Conversations', 'Messages']));
      } else if (state === 'background') {
        socket.disconnect();
      }
    });
    return () => {
      sub.remove();
      socket.disconnect();
    };
  }, [signedIn]);
}
