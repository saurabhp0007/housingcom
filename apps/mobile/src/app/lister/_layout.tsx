import { useTheme } from '@housingcom/ui';
import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useSession } from '@/features/auth/hooks/useSession';

/** Lister workspace: a drawer with My listings, Leads and Verification. */
export default function ListerLayout() {
  const { colors, typography } = useTheme();
  const { isLister } = useSession();
  if (!isLister) return <Redirect href="/profile" />;

  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.textPrimary,
        headerTitleStyle: typography.heading,
        drawerActiveTintColor: colors.primary,
        drawerActiveBackgroundColor: colors.primaryMuted,
        drawerInactiveTintColor: colors.textPrimary,
        drawerStyle: { backgroundColor: colors.surface },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Drawer.Screen name="index" options={{ title: 'My listings', drawerLabel: 'My listings' }} />
      <Drawer.Screen name="leads" options={{ title: 'Enquiries & visits', drawerLabel: 'Leads' }} />
      <Drawer.Screen
        name="verification"
        options={{ title: 'Get verified', drawerLabel: 'Verification' }}
      />
    </Drawer>
  );
}
