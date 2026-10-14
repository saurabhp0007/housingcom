import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { chatApi } from '@/features/chat/chat.api';
import { secureStorage } from '@/shared/storage/secure-storage';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { notificationsApi } from '../notifications.api';
import { pushService } from '../push.service';

/**
 * Registers the push token after sign-in, refreshes inbox counts when a push arrives,
 * and opens the right screen when a notification is tapped (also from a cold start).
 */
export function usePushNotifications(): void {
  const dispatch = useAppDispatch();
  const signedIn = useAppSelector((s) => s.session.status === 'authenticated');
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!signedIn) return;
    const register = async () => {
      const token = await pushService.getToken();
      if (!token) return;
      await dispatch(
        notificationsApi.endpoints.registerDevice.initiate({
          id: await secureStorage.getOrCreateDeviceId(),
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          pushToken: token,
        }),
      );
    };
    void register();

    const received = Notifications.addNotificationReceivedListener(() => {
      dispatch(notificationsApi.util.invalidateTags(['Notifications']));
      dispatch(chatApi.util.invalidateTags(['Conversations']));
    });
    // Token rotation (rare, e.g. app data restored on a new phone).
    const rotated = Notifications.addPushTokenListener(() => void register());
    return () => {
      received.remove();
      rotated.remove();
    };
  }, [signedIn, dispatch]);

  useEffect(() => {
    if (!lastResponse || !signedIn) return;
    const route = pushService.routeOf(lastResponse);
    if (route) router.push(route as Href);
    void Notifications.clearLastNotificationResponseAsync();
  }, [lastResponse, signedIn]);
}
