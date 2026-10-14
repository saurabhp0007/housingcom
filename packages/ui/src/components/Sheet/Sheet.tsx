import { BottomSheet, type SnapPoint } from '@expo/ui';
import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../primitives/AppText';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';

export interface SheetProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  /** Omit to size to content. ['half', 'full'] for filter/sort sheets. */
  snapPoints?: SnapPoint[];
  dismissible?: boolean;
}

/**
 * Native modal bottom sheet: Material 3 ModalBottomSheet on Android, SwiftUI sheet on iOS.
 * Used for filters, sort, map-pin previews and quick actions.
 */
export function Sheet({
  visible,
  onDismiss,
  title,
  snapPoints,
  dismissible = true,
  children,
}: PropsWithChildren<SheetProps>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <BottomSheet
      isPresented={visible}
      onDismiss={onDismiss}
      snapPoints={snapPoints}
      containerColor={colors.surface}
      shouldDismissOnBackPress={dismissible}
      shouldDismissOnClickOutside={dismissible}
      contentPadding={{ left: spacing.lg, right: spacing.lg, bottom: insets.bottom + spacing.lg }}
    >
      <View style={{ gap: spacing.lg }}>
        {title ? <AppText variant="heading">{title}</AppText> : null}
        {children}
      </View>
    </BottomSheet>
  );
}
