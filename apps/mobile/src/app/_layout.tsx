import { ThemeProvider as UiThemeProvider, ToastProvider, useTheme } from '@housingcom/ui';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { ForceUpdateGate } from '@/features/app-updates/components/ForceUpdateGate';
import { AppBootstrap } from '@/shared/components/AppBootstrap';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { store } from '@/shared/store/store';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <Provider store={store}>
            <UiThemeProvider>
              <ToastProvider>
                <AppBootstrap>
                  <ForceUpdateGate>
                    <RootNavigator />
                  </ForceUpdateGate>
                  <OfflineBanner />
                </AppBootstrap>
              </ToastProvider>
            </UiThemeProvider>
          </Provider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const theme = useTheme();
  const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          title: '',
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.textPrimary,
          headerTitleStyle: theme.typography.heading,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {/* These draw their own chrome: tab bar, auth stack, lister/admin drawers. */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="lister" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen
          name="lister-onboarding"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.65, 1],
            sheetGrabberVisible: true,
            sheetCornerRadius: theme.radius.xl,
          }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}
