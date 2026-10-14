import { ProgressView } from '@expo/ui/swift-ui';
import { NativeHost } from '../../native/NativeHost';

/** Native SwiftUI activity spinner. */
export function Loader() {
  return (
    <NativeHost>
      <ProgressView />
    </NativeHost>
  );
}
