import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { AuthProvider } from '@housingcom/contracts';
import { firebaseConfig } from '../../../config/configuration.js';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import type {
  IdentityVerifier,
  VerifiedIdentity,
} from '../interfaces/identity-verifier.interface.js';

const PROVIDER_BY_SIGN_IN: Record<string, AuthProvider> = {
  phone: AuthProvider.Phone,
  'google.com': AuthProvider.Google,
  'apple.com': AuthProvider.Apple,
};

/** Verifies Firebase ID tokens (phone OTP, Google, Apple) with the Admin SDK. */
@Injectable()
export class FirebaseIdentityVerifier implements IdentityVerifier {
  private readonly logger = new Logger(FirebaseIdentityVerifier.name);
  private app: App | undefined;

  constructor(
    @Inject(firebaseConfig.KEY) private readonly config: ConfigType<typeof firebaseConfig>,
  ) {}

  async verify(idToken: string): Promise<VerifiedIdentity> {
    let decoded: DecodedIdToken;
    try {
      decoded = await getAuth(this.getApp()).verifyIdToken(idToken, true);
    } catch (err) {
      this.logger.warn({ err }, 'Firebase ID token rejected');
      throw AppException.unauthorized(
        ErrorCode.InvalidIdentityToken,
        'Sign-in expired. Please try again.',
      );
    }

    const provider = PROVIDER_BY_SIGN_IN[decoded.firebase.sign_in_provider];
    if (!provider) {
      throw AppException.unauthorized(ErrorCode.InvalidIdentityToken, 'Unsupported sign-in method');
    }

    return {
      uid: decoded.uid,
      provider,
      phone: decoded.phone_number ?? null,
      email: decoded.email ?? null,
      name: (decoded.name as string | undefined) ?? null,
      picture: decoded.picture ?? null,
    };
  }

  private getApp(): App {
    if (this.app) return this.app;
    const { projectId, clientEmail, privateKey } = this.config;
    this.app =
      getApps()[0] ??
      initializeApp({
        credential:
          projectId && clientEmail && privateKey
            ? cert({ projectId, clientEmail, privateKey })
            : applicationDefault(),
        projectId,
      });
    return this.app;
  }
}
