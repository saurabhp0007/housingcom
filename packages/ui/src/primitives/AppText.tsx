import { Text, type TextProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { ColorPalette, TypographyVariant } from '../theme/tokens';

type TextColor = keyof Pick<
  ColorPalette,
  'textPrimary' | 'textSecondary' | 'textInverse' | 'primary' | 'danger' | 'success' | 'onPrimary'
>;

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
}

/** RN text bound to the type scale. Native (@expo/ui) components render their own text. */
export function AppText({
  variant = 'body',
  color = 'textPrimary',
  align,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      style={[theme.typography[variant], { color: theme.colors[color], textAlign: align }, style]}
      {...rest}
    />
  );
}
