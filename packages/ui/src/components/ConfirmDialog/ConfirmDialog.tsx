import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import type { ConfirmDialogProps } from './types';

/** iOS: native UIAlertController via RN Alert (same declarative API as Android's AlertDialog). */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onDismiss,
}: ConfirmDialogProps) {
  const handlers = useRef({ onConfirm, onDismiss });
  handlers.current = { onConfirm, onDismiss };

  useEffect(() => {
    if (!visible) return;
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => handlers.current.onDismiss() },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => handlers.current.onConfirm(),
        },
      ],
      { cancelable: true, onDismiss: () => handlers.current.onDismiss() },
    );
  }, [visible, title, message, confirmLabel, cancelLabel, destructive]);

  return null;
}
