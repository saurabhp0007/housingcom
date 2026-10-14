import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { env } from '@/shared/config/env';
import { getActiveConversation } from '@/features/chat/chat.realtime';

/** Must match the channel the API sends to (ExpoPushProvider). */
export const ANDROID_CHANNEL_ID = 'default';

/** Foreground behaviour: show banners, except for the chat thread already on screen. */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const url = notification.request.content.data?.url;
    const active = getActiveConversation();
    const isOpenChat = !!active && url === `/chat/${active}`;
    return {
      shouldShowBanner: !isOpenChat,
      shouldShowList: !isOpenChat,
      shouldPlaySound: !isOpenChat,
      shouldSetBadge: false,
    };
  },
});

export const pushService = {
  /**
   * Asks for permission (once) and returns this install's Expo push token, or null when
   * push isn't possible (simulator, denied, no EAS project configured).
   */
  async getToken(): Promise<string | null> {
    if (!Device.isDevice || !env.easProjectId) return null;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Messages and updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 120, 200],
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return null;
    try {
      return (await Notifications.getExpoPushTokenAsync({ projectId: env.easProjectId })).data;
    } catch {
      return null;
    }
  },

  /** In-app route carried by our notifications. */
  routeOf(response: Notifications.NotificationResponse): string | null {
    const url = response.notification.request.content.data?.url;
    return typeof url === 'string' && url.startsWith('/') ? url : null;
  },
};
