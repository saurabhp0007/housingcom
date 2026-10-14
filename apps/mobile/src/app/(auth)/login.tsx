import { zodResolver } from '@hookform/resolvers/zod';
import { AppText, Button, HStack, Screen, TextField, VStack, useTheme } from '@housingcom/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { SocialSignInButtons } from '@/features/auth/components/SocialSignInButtons';
import {
  firebaseAuthService,
  firebaseErrorMessage,
} from '@/features/auth/services/firebase-auth.service';

const schema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { colors } = useTheme();
  const [error, setError] = useState<string>();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { phone: '' } });

  const onSubmit = handleSubmit(async ({ phone }) => {
    setError(undefined);
    try {
      await firebaseAuthService.sendOtp(`+91${phone}`);
      router.push({ pathname: '/verify', params: { phone } });
    } catch (e) {
      setError(firebaseErrorMessage(e));
    }
  });

  return (
    <Screen
      scroll
      edges={['bottom']}
      footer={
        <VStack gap="sm">
          <Button label="Get OTP" loading={isSubmitting} onPress={onSubmit} />
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

        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <TextField
              label="Mobile number"
              prefix="+91"
              placeholder="98765 43210"
              keyboard="phone"
              returnKey="go"
              maxLength={10}
              autoFocus
              value={field.value}
              onChangeText={(t) => field.onChange(t.replace(/\D/g, ''))}
              onSubmit={() => void onSubmit()}
              error={errors.phone?.message ?? error}
            />
          )}
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
