import { AppText, HIT_SLOP, HStack, useTheme, Icon } from '@housingcom/ui';
import { Pressable, StyleSheet } from 'react-native';
import { useAppSelector } from '@/shared/store/hooks';

interface LocationPillProps {
  onPress: () => void;
  detecting?: boolean;
}

/** Shows the active search location; tapping opens the location sheet. */
export function LocationPill({ onPress, detecting }: LocationPillProps) {
  const { colors, radius, spacing } = useTheme();
  const selected = useAppSelector((s) => s.location.selected);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Change location"
      hitSlop={HIT_SLOP}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.md,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <HStack gap="xs" align="center">
        <Icon name="location" size={16} color={colors.primary} />
        <AppText variant="bodyStrong" numberOfLines={1} style={styles.label}>
          {detecting ? 'Detecting…' : (selected?.label ?? 'Set location')}
        </AppText>
        <Icon name="chevron-down" size={14} color={colors.textSecondary} />
      </HStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { height: 40, borderWidth: 1, justifyContent: 'center', alignSelf: 'flex-start' },
  label: { maxWidth: 200 },
});
