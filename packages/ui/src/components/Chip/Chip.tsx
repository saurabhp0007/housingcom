import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet } from 'react-native';
import { AppText } from '../../primitives/AppText';
import { useTheme } from '../../theme/ThemeProvider';
import { HIT_SLOP, radius, spacing } from '../../theme/tokens';
import type { ChipProps } from './types';

/** iOS has no filter-chip control; this matches the iOS capsule style. */
export function Chip({ label, selected = false, onPress, disabled, testID }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primaryMuted : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <AppText variant="caption" color={selected ? 'primary' : 'textPrimary'} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  label: { fontWeight: '600' },
});
