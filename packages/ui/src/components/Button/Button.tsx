import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, typography } from '../../theme/tokens';
import type { ButtonProps } from './types';

/** Fallback for platforms without @expo/ui native views (web, tests). */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  fullWidth = variant === 'primary',
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const filled = variant === 'primary' || variant === 'destructive';
  const background =
    variant === 'destructive'
      ? colors.danger
      : variant === 'primary'
        ? colors.primary
        : variant === 'tonal'
          ? colors.primaryMuted
          : 'transparent';
  const foreground = filled ? colors.onPrimary : colors.primary;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderColor: variant === 'outlined' ? colors.border : 'transparent',
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <Text style={[typography.bodyStrong, { color: foreground }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
