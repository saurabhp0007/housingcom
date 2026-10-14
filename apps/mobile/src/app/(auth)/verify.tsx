import { AppText, Button, Screen, TextField, VStack } from '@housingcom/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSignIn } from '@/features/auth/hooks/useSignIn';
import {
  firebaseAuthService,
  firebaseErrorMessage,
} from '@/features/auth/services/firebase-auth.service';

const OTP_LENGTH = 6;
const RESEND_AFTER_S = 30;

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { run, busy } = useSignIn();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [resendIn, setResendIn] = useState(RESEND_AFTER_S);

  useEffect(() => {
    if (!firebaseAuthService.hasPendingOtp()) router.back();
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const verify = async (value = code) => {
    if (value.length !== OTP_LENGTH || busy) return;
    setError(undefined);
    const ok = await run(() => firebaseAuthService.confirmOtp(value));
    if (!ok) setCode('');
  };

  const resend = async () => {
    try {
      await firebaseAuthService.sendOtp(`+91${phone}`);
      setResendIn(RESEND_AFTER_S);
    } catch (e) {
      setError(firebaseErrorMessage(e));
    }
  };

  return (
    <Screen
      scroll
      edges={['bottom']}
      footer={
        <Button
          label="Verify"
          loading={busy}
          disabled={code.length !== OTP_LENGTH}
          onPress={() => void verify()}
        />
      }
    >
      <VStack gap="xl">
        <VStack gap="sm">
          <AppText variant="title">Enter the code</AppText>
          <AppText color="textSecondary">Sent to +91 {phone}</AppText>
        </VStack>
        <TextField
          label="6-digit code"
          keyboard="number"
          maxLength={OTP_LENGTH}
          autoFocus
          value={code}
          error={error}
          onChangeText={(t) => {
            const digits = t.replace(/\D/g, '').slice(0, OTP_LENGTH);
            setCode(digits);
            if (digits.length === OTP_LENGTH) void verify(digits);
          }}
          returnKey="done"
          onSubmit={() => void verify()}
        />
        <Button
          variant="text"
          fullWidth={false}
          disabled={resendIn > 0}
          label={resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
          onPress={() => void resend()}
        />
      </VStack>
    </Screen>
  );
}
