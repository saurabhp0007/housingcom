import { StyleSheet, View } from 'react-native';
import { AppText } from '../../primitives/AppText';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';

export type PillTone =
  'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'featured' | 'verified';

export interface PillProps {
  label: string;
  tone?: PillTone;
}

/** Small status / badge label (listing status, Verified, Featured). */
export function Pill({ label, tone = 'neutral' }: PillProps) {
  const { colors } = useTheme();
  const fg = {
    neutral: colors.textSecondary,
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    featured: colors.featured,
    verified: colors.verified,
  }[tone];

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: tone === 'neutral' ? colors.surfaceMuted : `${fg}1F` },
      ]}
    >
      <AppText variant="label" style={{ color: fg }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
});
