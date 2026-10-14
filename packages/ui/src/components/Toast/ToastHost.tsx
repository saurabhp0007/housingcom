import { useCallback, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { AppText } from '../../primitives/AppText';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import type { ToastHostProps, ToastOptions } from './types';

const DURATION_MS = { short: 3000, long: 10000 } as const;

/** iOS / web: animated toast styled like a floating snackbar. Queues like the Android host. */
export function ToastHost({ ref, bottomOffset }: ToastHostProps) {
  const { colors } = useTheme();
  const [current, setCurrent] = useState<ToastOptions | null>(null);
  const queue = useRef<ToastOptions[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNext = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    const next = queue.current.shift() ?? null;
    setCurrent(next);
    if (next && !next.actionLabel) {
      timer.current = setTimeout(showNext, DURATION_MS[next.duration ?? 'short']);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    show: (options) => {
      queue.current.push(options);
      setCurrent((visible) => {
        if (!visible) setTimeout(showNext, 0);
        return visible;
      });
    },
  }));

  if (!current) return null;

  return (
    <View pointerEvents="box-none" style={[styles.container, { bottom: bottomOffset }]}>
      <Animated.View
        entering={FadeInDown.duration(200)}
        exiting={FadeOutDown.duration(150)}
        style={[styles.toast, { backgroundColor: colors.textPrimary }]}
      >
        <AppText color="textInverse" style={styles.message}>
          {current.message}
        </AppText>
        {current.actionLabel ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              current.onAction?.();
              showNext();
            }}
          >
            <AppText variant="bodyStrong" style={{ color: colors.primaryMuted }}>
              {current.actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: spacing.lg, right: spacing.lg },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  message: { flex: 1 },
});
