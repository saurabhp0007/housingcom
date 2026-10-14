import {
  OutlinedTextField,
  Text,
  useNativeState,
  type TextFieldImeAction,
  type TextFieldKeyboardType,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, testID as testIdModifier } from '@expo/ui/jetpack-compose/modifiers';
import { NativeHost } from '../../native/NativeHost';
import type { TextFieldKeyboard, TextFieldProps, TextFieldReturnKey } from './types';
import { useSyncedNativeState } from './useSyncedNativeState';

const keyboardMap: Record<TextFieldKeyboard, TextFieldKeyboardType> = {
  default: 'text',
  phone: 'phone',
  number: 'number',
  email: 'email',
  url: 'uri',
};

const imeMap: Record<TextFieldReturnKey, TextFieldImeAction> = {
  done: 'done',
  next: 'next',
  search: 'search',
  go: 'go',
  send: 'send',
};

/** Material 3 outlined text field rendered by Jetpack Compose. */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  prefix,
  keyboard = 'default',
  returnKey = 'done',
  onSubmit,
  secure,
  autoFocus,
  maxLength,
  editable = true,
  multiline,
  autoCapitalize = 'sentences',
  testID,
}: TextFieldProps) {
  const text = useSyncedNativeState(useNativeState, value);
  const supporting = error ?? helperText;
  const submit = onSubmit ? (v: string) => onSubmit(v) : undefined;

  return (
    <NativeHost matchContents={{ vertical: true }}>
      <OutlinedTextField
        value={text}
        onValueChange={onChangeText}
        isError={!!error}
        enabled={editable}
        autoFocus={autoFocus}
        maxLength={maxLength}
        singleLine={!multiline}
        minLines={multiline ? 3 : undefined}
        visualTransformation={secure ? 'password' : 'none'}
        keyboardOptions={{
          keyboardType: keyboardMap[keyboard],
          imeAction: imeMap[returnKey],
          autoCorrectEnabled: keyboard === 'default' && !secure,
          capitalization: autoCapitalize === 'none' ? 'none' : autoCapitalize,
        }}
        keyboardActions={{
          onDone: submit,
          onGo: submit,
          onSearch: submit,
          onSend: submit,
          onNext: submit,
        }}
        modifiers={[fillMaxWidth(), ...(testID ? [testIdModifier(testID)] : [])]}
      >
        <OutlinedTextField.Label>
          <Text>{label}</Text>
        </OutlinedTextField.Label>
        {placeholder ? (
          <OutlinedTextField.Placeholder>
            <Text>{placeholder}</Text>
          </OutlinedTextField.Placeholder>
        ) : null}
        {prefix ? (
          <OutlinedTextField.Prefix>
            <Text>{prefix}</Text>
          </OutlinedTextField.Prefix>
        ) : null}
        {supporting ? (
          <OutlinedTextField.SupportingText>
            <Text>{supporting}</Text>
          </OutlinedTextField.SupportingText>
        ) : null}
      </OutlinedTextField>
    </NativeHost>
  );
}
