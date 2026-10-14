import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import {
  brand,
  darkColors,
  lightColors,
  radius,
  spacing,
  typography,
  type ColorPalette,
} from './tokens';

export type ColorSchemePreference = 'system' | 'light' | 'dark';

export interface Theme {
  scheme: 'light' | 'dark';
  colors: ColorPalette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  seedColor: string;
}

const ThemeContext = createContext<Theme | null>(null);

interface ThemeProviderProps {
  preference?: ColorSchemePreference;
}

export function ThemeProvider({
  preference = 'system',
  children,
}: PropsWithChildren<ThemeProviderProps>) {
  const systemScheme = useColorScheme();
  const scheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const theme = useMemo<Theme>(
    () => ({
      scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
      spacing,
      radius,
      typography,
      seedColor: brand.seed,
    }),
    [scheme],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside <ThemeProvider>');
  return theme;
}
