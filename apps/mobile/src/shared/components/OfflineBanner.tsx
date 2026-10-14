import { AppText, useTheme } from '@housingcom/ui';
import { useNetworkState } from 'expo-network';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Slim banner under the status bar whenever the device has no internet. */
export function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetworkState();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const offline = isConnected === false || isInternetReachable === false;
  if (!offline) return null;

  return (
    <Animated.View
      entering={FadeInUp}
      exiting={FadeOutUp}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        top: insets.top,
        left: spacing.lg,
        right: spacing.lg,
        paddingVertical: spacing.xs,
        borderRadius: 999,
        alignItems: 'center',
        backgroundColor: colors.textPrimary,
      }}
    >
      <AppText variant="label" color="textInverse">
        You’re offline. Showing saved data.
      </AppText>
    </Animated.View>
  );
}
