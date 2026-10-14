import { AppText, Button, HStack, Screen, TextField, VStack, useTheme } from '@housingcom/ui';
import { router } from 'expo-router';
import { phoneSchema } from '@housingcom/contracts';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SocialSignInButtons } from '@/features/auth/components/SocialSignInButtons';
import {
  firebaseAuthService,
  firebaseErrorMessage,
} from '@/features/auth/services/firebase-auth.service';

export default function LoginScreen() {
  const { colors } = useTheme();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();
  const [isSubmitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    // Same rule the API uses (shared contract).
    if (!phoneSchema.safeParse(`+91${phone}`).success) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError(undefined);
    setSubmitting(true);
    try {
      await firebaseAuthService.sendOtp(`+91${phone}`);
      router.push({ pathname: '/verify', params: { phone } });
    } catch (e) {
      setError(firebaseErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      scroll
      edges={['bottom']}
      footer={
        <VStack gap="sm">
          <Button label="Get OTP" loading={isSubmitting} onPress={() => void onSubmit()} />
          <Button label="Skip for now" variant="text" onPress={() => router.back()} />
        </VStack>
      }
    >
      <VStack gap="xl">
        <VStack gap="sm">
          <AppText variant="display">Find your next place</AppText>
          <AppText color="textSecondary">
            Sign in with your mobile number. We’ll send a one-time code.
          </AppText>
        </VStack>

        <TextField
          label="Mobile number"
          prefix="+91"
          placeholder="98765 43210"
          keyboard="phone"
          returnKey="go"
          maxLength={10}
          autoFocus
          value={phone}
          onChangeText={(t) => {
            setPhone(t.replace(/\D/g, ''));
            setError(undefined);
          }}
          onSubmit={() => void onSubmit()}
          error={error}
        />

        <HStack align="center" gap="md">
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
          <AppText variant="caption" color="textSecondary">
            or
          </AppText>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
        </HStack>

        <SocialSignInButtons />

        <AppText variant="caption" color="textSecondary" align="center">
          By continuing you agree to our Terms and Privacy Policy.
        </AppText>
      </VStack>
    </Screen>
  );
}

const styles = StyleSheet.create({ rule: { flex: 1, height: StyleSheet.hairlineWidth } });
