import { useTheme } from '@housingcom/ui';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useSession } from '@/features/auth/hooks/useSession';
import { useChatUnreadCountQuery } from '@/features/chat/chat.api';
import { useNotificationsUnreadCountQuery } from '@/features/notifications/notifications.api';

/** Native tab bar: Material 3 NavigationBar on Android, UITabBar on iOS. */
export default function TabsLayout() {
  const { colors } = useTheme();
  const { isAuthenticated } = useSession();
  const opts = { skip: !isAuthenticated, pollingInterval: 120_000, refetchOnFocus: true };
  const chat = useChatUnreadCountQuery(undefined, opts).data?.count ?? 0;
  const updates = useNotificationsUnreadCountQuery(undefined, opts).data?.count ?? 0;
  const unread = isAuthenticated ? chat + updates : 0;

  return (
    <NativeTabs tintColor={colors.primary}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="saved">
        <NativeTabs.Trigger.Label>Saved</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="heart.fill" md="favorite" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="inbox">
        <NativeTabs.Trigger.Label>Inbox</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right.fill" md="chat" />
        <NativeTabs.Trigger.Badge hidden={unread === 0}>
          {unread > 99 ? '99+' : String(unread)}
        </NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
