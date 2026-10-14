export type ButtonVariant = 'primary' | 'tonal' | 'outlined' | 'text' | 'destructive';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Shows a spinner and blocks presses. */
  loading?: boolean;
  /** Stretches to the parent's width (default for primary CTAs). */
  fullWidth?: boolean;
  testID?: string;
}
