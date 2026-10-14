import type { AuthProvider } from '@housingcom/contracts';

export const IDENTITY_VERIFIER = Symbol('IDENTITY_VERIFIER');

/** A verified sign-in from the identity provider (Firebase today). */
export interface VerifiedIdentity {
  uid: string;
  provider: AuthProvider;
  phone: string | null;
  email: string | null;
  name: string | null;
  picture: string | null;
}

export interface IdentityVerifier {
  /** Throws AppException(InvalidIdentityToken) when the token is invalid or expired. */
  verify(idToken: string): Promise<VerifiedIdentity>;
}
