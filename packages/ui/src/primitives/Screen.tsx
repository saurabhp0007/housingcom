import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';

export interface ScreenProps {
  /** Wraps content in a keyboard-aware scroll view: focused inputs are always scrolled above the keyboard. */
  scroll?: boolean;
  /** Safe-area edges to pad. Screens under a native header usually drop 'top'. */
  edges?: Edge[];
  /** Horizontal gutter. Set false for edge-to-edge content (maps, galleries). */
  padded?: boolean;
  /** Pinned to the bottom, above the keyboard (e.g. a primary CTA). */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Base container for every screen: safe areas, theme background and keyboard handling
 * in one place so individual screens never deal with insets or keyboard avoidance.
 */
export function Screen({
  scroll = false,
  edges = ['top', 'bottom'],
  padded = true,
  footer,
  contentStyle,
  children,
}: PropsWithChildren<ScreenProps>) {
  const theme = useTheme();
  const gutter = padded ? { paddingHorizontal: spacing.lg } : null;

  const body = scroll ? (
    <KeyboardAwareScrollView
      bottomOffset={spacing.xxl}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, gutter, contentStyle]}
    >
      {children}
    </KeyboardAwareScrollView>
  ) : (
    <View style={[styles.fill, gutter, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.fill} enabled={!!footer || !scroll}>
        {body}
        {footer ? <View style={[styles.footer, gutter]}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxl },
  footer: { paddingTop: spacing.md, paddingBottom: spacing.md },
});
