import { Button, VStack } from '@housingcom/ui';
import { Platform } from 'react-native';
import { firebaseAuthService } from '../services/firebase-auth.service';
import { useSignIn } from '../hooks/useSignIn';

export function SocialSignInButtons() {
  const { run, busy } = useSignIn();
  return (
    <VStack gap="sm">
      <Button
        label="Continue with Google"
        variant="outlined"
        fullWidth
        disabled={busy}
        onPress={() => void run(firebaseAuthService.signInWithGoogle)}
      />
      {Platform.OS === 'ios' ? (
        <Button
          label="Continue with Apple"
          variant="outlined"
          fullWidth
          disabled={busy}
          onPress={() => void run(firebaseAuthService.signInWithApple)}
        />
      ) : null}
    </VStack>
  );
}
