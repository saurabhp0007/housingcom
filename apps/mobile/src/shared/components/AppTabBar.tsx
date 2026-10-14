import { AppText, useTheme } from '@housingcom/ui';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

const BAR_HEIGHT = 60;
const INDICATOR_INSET = 6;
const SPRING = { damping: 18, stiffness: 220, mass: 0.6 };

/**
 * Floating tab bar: a sliding highlight follows the active tab, tabs press in like physical
 * buttons, and every switch gives haptic feedback. Long-pressing a tab gives a firmer tap.
 */
export function AppTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { colors, scheme } = useTheme();
  const [width, setWidth] = useState(0);
  const tabWidth = width / state.routes.length;
  const position = useSharedValue(state.index);

  useEffect(() => {
    position.value = withSpring(state.index, SPRING);
  }, [state.index, position]);

  const indicator = useAnimatedStyle(() => ({
    width: Math.max(tabWidth - INDICATOR_INSET * 2, 0),
    transform: [{ translateX: position.value * tabWidth + INDICATOR_INSET }],
  }));

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 10) },
      ]}
    >
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={[
          styles.bar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowOpacity: scheme === 'dark' ? 0.5 : 0.12,
          },
        ]}
      >
        {width > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.indicator, { backgroundColor: colors.primaryMuted }, indicator]}
          />
        ) : null}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]!;
          const focused = state.index === index;
          const color = focused ? colors.primary : colors.textSecondary;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (focused || event.defaultPrevented) return;
            void Haptics.selectionAsync();
            navigation.navigate(route.name, route.params);
          };

          const onLongPress = () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TabButton
              key={route.key}
              label={options.title ?? route.name}
              focused={focused}
              color={color}
              badge={options.tabBarBadge}
              position={position}
              index={index}
              onPress={onPress}
              onLongPress={onLongPress}
              icon={options.tabBarIcon?.({ focused, color, size: 22 })}
            />
          );
        })}
      </View>
    </View>
  );
}

interface TabButtonProps {
  label: string;
  focused: boolean;
  color: string;
  badge?: number | string;
  position: SharedValue<number>;
  index: number;
  icon: React.ReactNode;
  onPress: () => void;
  onLongPress: () => void;
}

function TabButton({
  label,
  focused,
  color,
  badge,
  position,
  index,
  icon,
  onPress,
  onLongPress,
}: TabButtonProps) {
  const { colors } = useTheme();
  const pressed = useSharedValue(0);

  const animated = useAnimatedStyle(() => {
    const nearness = Math.max(0, 1 - Math.abs(position.value - index));
    return {
      transform: [
        { scale: 1 - pressed.value * 0.1 },
        { translateY: -nearness * 1.5 + pressed.value * 1.5 },
      ],
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    const nearness = Math.max(0, 1 - Math.abs(position.value - index));
    return { transform: [{ scale: 1 + nearness * 0.08 }] };
  });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={typeof badge !== 'undefined' ? `${label}, ${badge} new` : label}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        pressed.value = withSpring(1, SPRING);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, SPRING);
      }}
      style={styles.tab}
    >
      <Animated.View style={[styles.tabInner, animated]}>
        <Animated.View style={iconStyle}>
          {icon}
          {typeof badge !== 'undefined' ? (
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.danger, borderColor: colors.surface },
              ]}
            >
              <AppText style={styles.badgeText}>{String(badge)}</AppText>
            </View>
          ) : null}
        </Animated.View>
        <AppText
          numberOfLines={1}
          style={[styles.label, { color, fontWeight: focused ? '700' : '500' }]}
        >
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingTop: 6 },
  bar: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 10,
  },
  indicator: {
    position: 'absolute',
    top: INDICATOR_INSET,
    bottom: INDICATOR_INSET,
    left: 0,
    borderRadius: 16,
  },
  tab: { flex: 1 },
  tabInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 11, lineHeight: 14 },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, lineHeight: 12, fontWeight: '700' },
});
