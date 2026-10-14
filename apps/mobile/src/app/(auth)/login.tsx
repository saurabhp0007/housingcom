import { AppText, Button, Screen, TextField, VStack } from '@housingcom/ui';
import { router } from 'expo-router';
import { phoneSchema } from '@housingcom/contracts';
import { useState } from 'react';
import { useSendOtpMutation } from '@/features/auth/auth.api';
import { toAppError } from '@/shared/api/api-error';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();
  const [sendOtp, { isLoading: isSubmitting }] = useSendOtpMutation();

  const onSubmit = async () => {
    // Same rule the API uses (shared contract).
    if (!phoneSchema.safeParse(`+91${phone}`).success) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError(undefined);
    try {
      await sendOtp({ phone: `+91${phone}` }).unwrap();
      router.push({ pathname: '/verify', params: { phone } });
    } catch (e) {
      setError(toAppError(e).message);
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

        <AppText variant="caption" color="textSecondary" align="center">
          By continuing you agree to our Terms and Privacy Policy.
        </AppText>
      </VStack>
    </Screen>
  );
}
