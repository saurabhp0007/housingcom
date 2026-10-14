import { Host, type UniversalHostProps } from '@expo/ui';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Every @expo/ui component must live inside a Host. This one is pre-wired to the
 * app theme: Material 3 palette seeded from the brand colour on Android, SwiftUI tint on iOS.
 * `matchContents` defaults to true so native views size themselves inside RN layouts.
 */
export function NativeHost({ matchContents = true, ...props }: UniversalHostProps) {
  const theme = useTheme();
  return (
    <Host
      matchContents={matchContents}
      colorScheme={theme.scheme}
      seedColor={theme.seedColor}
      {...props}
    />
  );
}
