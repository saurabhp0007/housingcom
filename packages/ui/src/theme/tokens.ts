/**
 * Design tokens. Every colour, size and radius in the app comes from here.
 * `brand.seed` also seeds the Material 3 palette on Android (Material You fallback)
 * and the SwiftUI tint on iOS, so native controls and RN views stay in sync.
 */
export const brand = {
  seed: '#4F46E5',
} as const;

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  primary: string;
  primaryMuted: string;
  onPrimary: string;
  success: string;
  warning: string;
  danger: string;
  featured: string;
  verified: string;
  scrim: string;
  skeleton: string;
}

export const lightColors: ColorPalette = {
  background: '#F7F7FB',
  surface: '#FFFFFF',
  surfaceMuted: '#EFEFF6',
  border: '#E3E3EE',
  textPrimary: '#14141F',
  textSecondary: '#5C5C70',
  textInverse: '#FFFFFF',
  primary: brand.seed,
  primaryMuted: '#E8E7FD',
  onPrimary: '#FFFFFF',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  featured: '#F59E0B',
  verified: '#0EA5E9',
  scrim: 'rgba(10,10,20,0.45)',
  skeleton: '#E6E6F0',
};

export const darkColors: ColorPalette = {
  background: '#0E0E16',
  surface: '#17171F',
  surfaceMuted: '#20202B',
  border: '#2B2B38',
  textPrimary: '#F2F2F7',
  textSecondary: '#A1A1B5',
  textInverse: '#14141F',
  primary: '#8B85FF',
  primaryMuted: '#25234A',
  onPrimary: '#0E0E16',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#F87171',
  featured: '#FBBF24',
  verified: '#38BDF8',
  scrim: 'rgba(0,0,0,0.6)',
  skeleton: '#23232F',
};

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;
export type SpacingToken = keyof typeof spacing;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.3 },
} as const;
export type TypographyVariant = keyof typeof typography;

export const motion = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

/** Minimum touch target (Material + Apple HIG). */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
