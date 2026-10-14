import { useToast } from '@housingcom/ui';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { toAppError } from '@/shared/api/api-error';
import { useAppDispatch } from '@/shared/store/hooks';
import { sessionService } from '../services/session.service';

/** Verifies the OTP, starts the session, greets and closes the auth modal. */
export function useSignIn() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const signIn = useCallback(
    async (phone: string, code: string): Promise<boolean> => {
      setBusy(true);
      try {
        const session = await sessionService.signIn(dispatch, phone, code);
        toast.show(session.isNewUser ? 'Welcome! Your account is ready.' : 'Welcome back!');
        if (router.canDismiss()) router.dismissAll();
        return true;
      } catch (error) {
        toast.show(toAppError(error).message);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [dispatch, toast],
  );

  return { signIn, busy };
}
