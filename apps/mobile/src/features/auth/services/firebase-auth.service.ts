import {
  AppleAuthProvider,
  getAuth,
  getIdToken,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
} from '@react-native-firebase/auth';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { env } from '@/shared/config/env';

/**
 * Everything that talks to Firebase Auth. Screens only ever receive a Firebase ID token,
 * which the API exchanges for our own session.
 */
let pendingConfirmation: ConfirmationResult | null = null;
let googleConfigured = false;

export class SignInCancelledError extends Error {
  constructor() {
    super('Sign-in cancelled');
  }
}

export const firebaseAuthService = {
  /** Sends the OTP SMS. Keeps the (non-serialisable) confirmation outside Redux. */
  async sendOtp(phoneE164: string): Promise<void> {
    pendingConfirmation = await signInWithPhoneNumber(getAuth(), phoneE164);
  },

  hasPendingOtp: () => pendingConfirmation !== null,

  async confirmOtp(code: string): Promise<string> {
    if (!pendingConfirmation) throw new Error('No OTP request in progress');
    const credential = await pendingConfirmation.confirm(code);
    if (!credential?.user) throw new Error('OTP verification failed');
    pendingConfirmation = null;
    return getIdToken(credential.user);
  },

  async signInWithGoogle(): Promise<string> {
    if (!googleConfigured) {
      GoogleSignin.configure({ webClientId: env.googleWebClientId });
      googleConfigured = true;
    }
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response) || !response.data.idToken) throw new SignInCancelledError();
    const { user } = await signInWithCredential(
      getAuth(),
      GoogleAuthProvider.credential(response.data.idToken),
    );
    return getIdToken(user);
  },

  async signInWithApple(): Promise<string> {
    // Apple receives the SHA-256 of the nonce; Firebase verifies it against the raw value.
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );
    try {
      const apple = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      if (!apple.identityToken) throw new SignInCancelledError();
      const { user } = await signInWithCredential(
        getAuth(),
        AppleAuthProvider.credential(apple.identityToken, rawNonce),
      );
      return getIdToken(user);
    } catch (err) {
      if ((err as { code?: string }).code === 'ERR_REQUEST_CANCELED')
        throw new SignInCancelledError();
      throw err;
    }
  },

  /** Our API session is the source of truth; the Firebase session is only needed to mint the ID token. */
  async signOut(): Promise<void> {
    pendingConfirmation = null;
    await signOut(getAuth()).catch(() => undefined);
  },
};

/** Maps Firebase error codes to user-facing copy. */
export function firebaseErrorMessage(error: unknown): string {
  const code = (error as { code?: string }).code ?? '';
  if (code.includes('invalid-verification-code'))
    return 'That code is incorrect. Please check and try again.';
  if (code.includes('code-expired') || code.includes('session-expired'))
    return 'The code has expired. Request a new one.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Please try again later.';
  if (code.includes('invalid-phone-number')) return 'Enter a valid mobile number.';
  if (code.includes('network')) return 'You seem to be offline. Check your connection.';
  return 'Something went wrong. Please try again.';
}
