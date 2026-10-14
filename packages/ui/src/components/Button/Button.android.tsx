import {
  Button as FilledButton,
  CircularProgressIndicator,
  FilledTonalButton,
  OutlinedButton,
  Text,
  TextButton,
} from '@expo/ui/jetpack-compose';
import {
  fillMaxWidth,
  height,
  size,
  testID as testIdModifier,
} from '@expo/ui/jetpack-compose/modifiers';
import * as Haptics from 'expo-haptics';
import { NativeHost } from '../../native/NativeHost';
import { useTheme } from '../../theme/ThemeProvider';
import type { ButtonProps, ButtonVariant } from './types';

const BUTTON_HEIGHT = 52;

const componentFor: Record<ButtonVariant, typeof FilledButton> = {
  primary: FilledButton,
  destructive: FilledButton,
  tonal: FilledTonalButton,
  outlined: OutlinedButton,
  text: TextButton,
};

/** Material 3 button rendered by Jetpack Compose. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  fullWidth = variant === 'primary',
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const Component = componentFor[variant];
  const isInteractive = !disabled && !loading;

  const modifiers = [
    height(BUTTON_HEIGHT),
    ...(fullWidth ? [fillMaxWidth()] : []),
    ...(testID ? [testIdModifier(testID)] : []),
  ];

  const handlePress = () => {
    void Haptics.selectionAsync();
    onPress?.();
  };

  return (
    <NativeHost matchContents={fullWidth ? { vertical: true } : true}>
      <Component
        enabled={isInteractive}
        onClick={isInteractive ? handlePress : undefined}
        modifiers={modifiers}
        colors={
          variant === 'destructive'
            ? { containerColor: theme.colors.danger, contentColor: '#FFFFFF' }
            : undefined
        }
      >
        {loading ? (
          <CircularProgressIndicator strokeWidth={2.5} modifiers={[size(20, 20)]} />
        ) : (
          <Text style={{ typography: 'labelLarge' }}>{label}</Text>
        )}
      </Component>
    </NativeHost>
  );
}
