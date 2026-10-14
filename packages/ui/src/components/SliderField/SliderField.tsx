import { Slider } from '@expo/ui';
import { NativeHost } from '../../native/NativeHost';
import { AppText } from '../../primitives/AppText';
import { HStack, VStack } from '../../primitives/Stack';

export interface SliderFieldProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Formats the value shown on the right, e.g. (v) => `${Math.round(v * 100)}%`. */
  format?: (value: number) => string;
  helperText?: string;
}

/** Native slider (Material 3 on Android, SwiftUI on iOS) with a label and live value. */
export function SliderField({
  label,
  value,
  onValueChange,
  min = 0,
  max = 1,
  step,
  format,
  helperText,
}: SliderFieldProps) {
  return (
    <VStack gap="xs">
      <HStack justify="space-between" align="center">
        <AppText variant="bodyStrong">{label}</AppText>
        <AppText variant="bodyStrong" color="primary">
          {format ? format(value) : value.toFixed(2)}
        </AppText>
      </HStack>
      <NativeHost matchContents={{ vertical: true }}>
        <Slider value={value} onValueChange={onValueChange} min={min} max={max} step={step} />
      </NativeHost>
      {helperText ? (
        <AppText variant="caption" color="textSecondary">
          {helperText}
        </AppText>
      ) : null}
    </VStack>
  );
}
