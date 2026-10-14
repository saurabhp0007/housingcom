import { Icon, useTheme, type IconName } from '@housingcom/ui';
import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';
import { useSession } from '@/features/auth/hooks/useSession';
import { useChatUnreadCountQuery } from '@/features/chat/chat.api';
import { useNotificationsUnreadCountQuery } from '@/features/notifications/notifications.api';
import { AppTabBar } from '@/shared/components/AppTabBar';

interface TabIconProps {
  focused: boolean;
  color: ColorValue;
  size: number;
  /** Filled glyph; the outline variant (`<name>-outline`) is shown while inactive. */
  name: IconName;
}

function TabIcon({ focused, color, size, name }: TabIconProps) {
  return <Icon name={focused ? name : (`${name}-outline` as IconName)} size={size} color={color} />;
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const { isAuthenticated } = useSession();
  const opts = { skip: !isAuthenticated, pollingInterval: 120_000, refetchOnFocus: true };
  const chat = useChatUnreadCountQuery(undefined, opts).data?.count ?? 0;
  const updates = useNotificationsUnreadCountQuery(undefined, opts).data?.count ?? 0;
  const unread = isAuthenticated ? chat + updates : 0;

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: (p) => <TabIcon {...p} name="home" />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: (p) => <TabIcon {...p} name="search" />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: (p) => <TabIcon {...p} name="heart" />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarIcon: (p) => <TabIcon {...p} name="chatbubbles" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: (p) => <TabIcon {...p} name="person-circle" />,
        }}
      />
    </Tabs>
  );
}
