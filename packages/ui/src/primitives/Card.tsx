import type { PropsWithChildren } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, type SpacingToken } from '../theme/tokens';

export interface CardProps {
  padding?: SpacingToken;
  tone?: 'surface' | 'muted' | 'primary';
  style?: StyleProp<ViewStyle>;
}

/** Rounded surface used for grouped content (forms, summaries, settings rows). */
export function Card({
  padding = 'lg',
  tone = 'surface',
  style,
  children,
}: PropsWithChildren<CardProps>) {
  const { colors, radius } = useTheme();
  const background =
    tone === 'primary'
      ? colors.primaryMuted
      : tone === 'muted'
        ? colors.surfaceMuted
        : colors.surface;
  return (
    <View
      style={[
        {
          backgroundColor: background,
          borderColor: tone === 'surface' ? colors.border : background,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: spacing[padding],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
