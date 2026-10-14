import { TextInput, useNativeState } from '@expo/ui';
import { StyleSheet, View } from 'react-native';
import { NativeHost } from '../../native/NativeHost';
import { AppText } from '../../primitives/AppText';
import { HStack } from '../../primitives/Stack';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import type { TextFieldKeyboard, TextFieldProps } from './types';
import { useSyncedNativeState } from './useSyncedNativeState';

const keyboardMap = {
  default: 'default',
  phone: 'phone-pad',
  number: 'number-pad',
  email: 'email-address',
  url: 'url',
} as const satisfies Record<TextFieldKeyboard, string>;

/**
 * iOS: SwiftUI TextField via @expo/ui. The label, prefix and helper are RN views
 * around the native input so the field matches the Material layout used on Android.
 */
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
  const { colors } = useTheme();
  const text = useSyncedNativeState(useNativeState, value);
  const supporting = error ?? helperText;

  return (
    <View style={styles.wrapper}>
      <AppText variant="label" color="textSecondary">
        {label}
      </AppText>
      <HStack
        align="center"
        gap="sm"
        style={[
          styles.field,
          { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border },
        ]}
      >
        {prefix ? <AppText variant="bodyStrong">{prefix}</AppText> : null}
        <View style={styles.input}>
          <NativeHost matchContents={{ vertical: true }}>
            <TextInput
              testID={testID}
              value={text}
              onChangeText={onChangeText}
              placeholder={placeholder}
              keyboardType={keyboardMap[keyboard]}
              returnKeyType={returnKey}
              onSubmitEditing={onSubmit}
              secureTextEntry={secure}
              autoFocus={autoFocus}
              maxLength={maxLength}
              editable={editable}
              multiline={multiline}
              autoCapitalize={autoCapitalize}
              autoCorrect={keyboard === 'default' && !secure}
              cursorColor={colors.primary}
              textStyle={{ fontSize: 16, color: colors.textPrimary }}
            />
          </NativeHost>
        </View>
      </HStack>
      {supporting ? (
        <AppText variant="caption" color={error ? 'danger' : 'textSecondary'}>
          {supporting}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  field: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1 },
});
