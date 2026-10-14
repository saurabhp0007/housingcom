import { Switch } from '@expo/ui';
import { NativeHost } from '../../native/NativeHost';

export interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  testID?: string;
}

/** Native switch: Material 3 Switch on Android, SwiftUI Toggle on iOS. */
export function Toggle(props: ToggleProps) {
  return (
    <NativeHost matchContents={{ vertical: true }}>
      <Switch {...props} />
    </NativeHost>
  );
}
