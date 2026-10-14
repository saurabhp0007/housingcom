export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Styles the confirm action as destructive (delete, reject, block). */
  destructive?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}
