export const OTP_VERIFIER = Symbol('OTP_VERIFIER');

/** Delivers and checks one-time codes for phone sign-in. */
export interface OtpVerifier {
  send(phone: string): Promise<void>;
  /** Returns false when the code is wrong or expired. */
  verify(phone: string, code: string): Promise<boolean>;
}
