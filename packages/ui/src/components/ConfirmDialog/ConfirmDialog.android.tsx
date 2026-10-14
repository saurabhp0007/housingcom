import { AlertDialog, Text, TextButton } from '@expo/ui/jetpack-compose';
import { NativeHost } from '../../native/NativeHost';
import { useTheme } from '../../theme/ThemeProvider';
import type { ConfirmDialogProps } from './types';

/** Material 3 AlertDialog rendered by Jetpack Compose. */
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
  const { colors } = useTheme();
  if (!visible) return null;

  return (
    <NativeHost style={{ position: 'absolute' }} pointerEvents="box-none">
      <AlertDialog onDismissRequest={onDismiss}>
        <AlertDialog.Title>
          <Text>{title}</Text>
        </AlertDialog.Title>
        {message ? (
          <AlertDialog.Text>
            <Text>{message}</Text>
          </AlertDialog.Text>
        ) : null}
        <AlertDialog.ConfirmButton>
          <TextButton
            onClick={onConfirm}
            colors={destructive ? { contentColor: colors.danger } : undefined}
          >
            <Text>{confirmLabel}</Text>
          </TextButton>
        </AlertDialog.ConfirmButton>
        <AlertDialog.DismissButton>
          <TextButton onClick={onDismiss}>
            <Text>{cancelLabel}</Text>
          </TextButton>
        </AlertDialog.DismissButton>
      </AlertDialog>
    </NativeHost>
  );
}
