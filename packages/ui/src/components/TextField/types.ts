export type TextFieldKeyboard = 'default' | 'phone' | 'number' | 'email' | 'url';
export type TextFieldReturnKey = 'done' | 'next' | 'search' | 'go' | 'send';

export interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Error message; marks the field invalid when present. */
  error?: string;
  helperText?: string;
  /** Fixed text before the input, e.g. "+91". */
  prefix?: string;
  keyboard?: TextFieldKeyboard;
  returnKey?: TextFieldReturnKey;
  onSubmit?: (text: string) => void;
  secure?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  editable?: boolean;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  testID?: string;
}
