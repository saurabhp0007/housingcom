import { SnackbarHost, type SnackbarHostRef } from '@expo/ui/jetpack-compose';
import { useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { NativeHost } from '../../native/NativeHost';
import type { ToastHostProps } from './types';

/** Material 3 Snackbar via Compose's SnackbarHost (queues natively). */
export function ToastHost({ ref, bottomOffset }: ToastHostProps) {
  const hostRef = useRef<SnackbarHostRef>(null);

  useImperativeHandle(ref, () => ({
    show: ({ message, actionLabel, onAction, duration }) => {
      void hostRef.current
        ?.showSnackbar({
          message,
          actionLabel,
          withDismissAction: !!actionLabel,
          duration: actionLabel ? 'indefinite' : duration,
        })
        .then((result) => {
          if (result === 'actionPerformed') onAction?.();
        });
    },
  }));

  return (
    <NativeHost
      matchContents={{ vertical: true }}
      pointerEvents="box-none"
      style={[styles.host, { bottom: bottomOffset }]}
    >
      <SnackbarHost ref={hostRef} />
    </NativeHost>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0 },
});
