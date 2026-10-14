import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { ColorValue, StyleProp, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export interface IconProps {
  name: IconName;
  size?: number;
  /** Defaults to the primary text colour. */
  color?: ColorValue;
  style?: StyleProp<TextStyle>;
}

/** The app's only icon set (Ionicons): crisp filled and outline pairs, identical on iOS and Android. */
export function Icon({ name, size = 22, color, style }: IconProps) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={color ?? colors.textPrimary} style={style} />;
}
