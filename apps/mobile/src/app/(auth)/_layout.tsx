import { useTheme } from '@housingcom/ui';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTitle: '',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
