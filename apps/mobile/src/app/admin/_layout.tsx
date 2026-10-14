import { UserRole } from '@housingcom/contracts';
import { useTheme } from '@housingcom/ui';
import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useSession } from '@/features/auth/hooks/useSession';

/** Admin panel (inside the same app, per the PRD): drawer navigation between sections. */
export default function AdminLayout() {
  const { colors, typography } = useTheme();
  const { user } = useSession();
  if (!user?.roles.includes(UserRole.Admin)) return <Redirect href="/profile" />;

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
      <Drawer.Screen name="index" options={{ title: 'Dashboard' }} />
      <Drawer.Screen name="approvals" options={{ title: 'Listing approvals' }} />
      <Drawer.Screen name="verifications" options={{ title: 'Lister verification' }} />
      <Drawer.Screen name="users" options={{ title: 'Users' }} />
      <Drawer.Screen name="cities" options={{ title: 'Cities & areas' }} />
    </Drawer>
  );
}
