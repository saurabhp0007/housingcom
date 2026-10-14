import { LoadingIndicator } from '@expo/ui/jetpack-compose';
import { NativeHost } from '../../native/NativeHost';

/** Material 3 expressive morphing-shape loading indicator. */
export function Loader() {
  return (
    <NativeHost>
      <LoadingIndicator />
    </NativeHost>
  );
}
