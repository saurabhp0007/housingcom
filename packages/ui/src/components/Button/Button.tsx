import { Button as SwiftButton, ProgressView } from '@expo/ui/swift-ui';
import {
  buttonBorderShape,
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  frame,
} from '@expo/ui/swift-ui/modifiers';
import * as Haptics from 'expo-haptics';
import { NativeHost } from '../../native/NativeHost';
import type { ButtonProps, ButtonVariant } from './types';

const styleFor: Record<ButtonVariant, Parameters<typeof buttonStyle>[0]> = {
  primary: 'borderedProminent',
  destructive: 'borderedProminent',
  tonal: 'bordered',
  outlined: 'bordered',
  text: 'borderless',
};

/** Native SwiftUI button. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  fullWidth = variant === 'primary',
  testID,
}: ButtonProps) {
  const isInteractive = !disabled && !loading;

  const handlePress = () => {
    void Haptics.selectionAsync();
    onPress?.();
  };

  return (
    <NativeHost matchContents={fullWidth ? { vertical: true } : true} testID={testID}>
      <SwiftButton
        role={variant === 'destructive' ? 'destructive' : 'default'}
        onPress={isInteractive ? handlePress : undefined}
        modifiers={[
          buttonStyle(styleFor[variant]),
          buttonBorderShape('capsule'),
          controlSize('large'),
          disabledModifier(!isInteractive),
          ...(fullWidth ? [frame({ maxWidth: Number.POSITIVE_INFINITY })] : []),
        ]}
        label={loading ? undefined : label}
      >
        {loading ? <ProgressView /> : undefined}
      </SwiftButton>
    </NativeHost>
  );
}
