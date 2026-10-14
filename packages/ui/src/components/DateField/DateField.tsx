import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { AppText } from '../../primitives/AppText';
import { HStack, VStack } from '../../primitives/Stack';
import { useTheme } from '../../theme/ThemeProvider';
import type { DateFieldProps } from './types';

/** iOS: native compact SwiftUI date picker inline with its label. */
export function DateField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  error,
}: DateFieldProps) {
  const { colors, scheme } = useTheme();
  return (
    <VStack gap="xs">
      <HStack align="center" justify="space-between">
        <AppText variant="label" color="textSecondary">
          {label}
        </AppText>
        <DateTimePicker
          value={value}
          mode="date"
          display="compact"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          accentColor={colors.primary}
          themeVariant={scheme}
          onValueChange={(_, date) => onChange(date)}
        />
      </HStack>
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : null}
    </VStack>
  );
}
