import { useEffect } from 'react';
import type { DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { radius as radii } from '../../theme/tokens';

export interface SkeletonProps {
  width?: DimensionValue;
  height: number;
  radius?: keyof typeof radii;
}

/** Pulsing placeholder shown while content loads (never a blank screen or bare spinner). */
export function Skeleton({ width = '100%', height, radius = 'sm' }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.45, { duration: 800 }), -1, true);
  }, [opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: radii[radius], backgroundColor: colors.skeleton },
        animated,
      ]}
    />
  );
}
