import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { AppText } from '../../primitives/AppText';
import { VStack } from '../../primitives/Stack';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { formatDate, type DateFieldProps } from './types';

/** Field that opens the Material 3 date picker dialog (Jetpack Compose). */
export function DateField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  error,
}: DateFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <VStack gap="xs">
      <AppText variant="label" color="textSecondary">
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatDate(value)}`}
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          { borderColor: error ? colors.danger : colors.border, backgroundColor: colors.surface },
        ]}
      >
        <AppText>{formatDate(value)}</AppText>
      </Pressable>
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : null}
      {open ? (
        <DateTimePicker
          value={value}
          mode="date"
          presentation="dialog"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          accentColor={colors.primary}
          onChange={(event, date) => {
            setOpen(false);
            if (event.type === 'set' && date) onChange(date);
          }}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
    </VStack>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
});
