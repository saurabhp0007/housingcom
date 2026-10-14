import { useToast } from '@housingcom/ui';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { toAppError } from '@/shared/api/api-error';
import { useAppDispatch } from '@/shared/store/hooks';
import { firebaseErrorMessage, SignInCancelledError } from '../services/firebase-auth.service';
import { sessionService } from '../services/session.service';

/** Wraps any provider flow (OTP / Google / Apple): exchange token, greet, close the auth modal. */
export function useSignIn() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (getIdToken: () => Promise<string>): Promise<boolean> => {
      setBusy(true);
      try {
        const idToken = await getIdToken();
        const session = await sessionService.signIn(dispatch, idToken);
        toast.show(session.isNewUser ? 'Welcome! Your account is ready.' : 'Welcome back!');
        if (router.canDismiss()) router.dismissAll();
        return true;
      } catch (error) {
        if (error instanceof SignInCancelledError) return false;
        const isApiError = typeof error === 'object' && error !== null && 'status' in error;
        toast.show(isApiError ? toAppError(error).message : firebaseErrorMessage(error));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [dispatch, toast],
  );

  return { run, busy };
}
