import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  UserStatus,
  type AuthSessionResponse,
  type AuthTokensResponse,
} from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import { DomainEvent, type UserLoggedInEvent } from '../../../core/events/domain-events.js';
import type { User } from '../../users/entities/user.entity.js';
import { toUserResponse } from '../../users/mappers/user.mapper.js';
import { UsersService } from '../../users/services/users.service.js';
import type { FirebaseLoginDto } from '../dto/firebase-login.dto.js';
import {
  AUTH_SESSIONS_REPOSITORY,
  type AuthSessionsRepository,
} from '../interfaces/auth-sessions-repository.interface.js';
import {
  IDENTITY_VERIFIER,
  type IdentityVerifier,
} from '../interfaces/identity-verifier.interface.js';
import { TokenService } from './token.service.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(IDENTITY_VERIFIER) private readonly identityVerifier: IdentityVerifier,
    @Inject(AUTH_SESSIONS_REPOSITORY) private readonly sessions: AuthSessionsRepository,
    private readonly usersService: UsersService,
    private readonly tokens: TokenService,
    private readonly events: EventEmitter2,
  ) {}

  /** Exchanges a Firebase ID token (phone OTP / Google / Apple) for our own session. */
  async loginWithFirebase(dto: FirebaseLoginDto): Promise<AuthSessionResponse> {
    const identity = await this.identityVerifier.verify(dto.idToken);
    const { user, isNew } = await this.usersService.findOrCreateByIdentity({
      firebaseUid: identity.uid,
      phone: identity.phone,
      email: identity.email,
      fullName: identity.name,
      avatarUrl: identity.picture,
      authProvider: identity.provider,
    });
    this.assertActive(user);

    const now = new Date();
    const device = dto.device;
    if (device) {
      await this.sessions.revokeForDevice(user.id, device.id, now);
      await this.usersService.registerDevice({
        userId: user.id,
        deviceId: device.id,
        platform: device.platform,
        pushToken: device.pushToken,
      });
    }

    const refresh = this.tokens.issueRefreshToken(now);
    await this.sessions.create({
      userId: user.id,
      refreshTokenHash: refresh.hash,
      deviceId: device?.id ?? null,
      platform: device?.platform ?? null,
      expiresAt: refresh.expiresAt,
    });
    await this.usersService.recordLogin(user.id);

    this.events.emit(DomainEvent.UserLoggedIn, {
      userId: user.id,
      deviceId: device?.id,
      platform: device?.platform,
    } satisfies UserLoggedInEvent);

    return {
      accessToken: await this.tokens.signAccessToken(user.id, user.roles),
      refreshToken: refresh.token,
      expiresIn: this.tokens.accessTokenTtlSeconds,
      user: toUserResponse(user),
      isNewUser: isNew,
    };
  }

  /** Rotates the refresh token. A reused (already rotated) token is rejected. */
  async refresh(refreshToken: string): Promise<AuthTokensResponse> {
    const now = new Date();
    const session = await this.sessions.findActiveByHash(
      this.tokens.hashRefreshToken(refreshToken),
      now,
    );
    if (!session) {
      throw AppException.unauthorized(
        ErrorCode.InvalidRefreshToken,
        'Session expired. Please sign in again.',
      );
    }

    const user = await this.usersService.getById(session.userId);
    this.assertActive(user);

    const next = this.tokens.issueRefreshToken(now);
    await this.sessions.rotate(session.id, next.hash, next.expiresAt, now);

    return {
      accessToken: await this.tokens.signAccessToken(user.id, user.roles),
      refreshToken: next.token,
      expiresIn: this.tokens.accessTokenTtlSeconds,
    };
  }

  logout(refreshToken: string): Promise<void> {
    return this.sessions.revokeByHash(this.tokens.hashRefreshToken(refreshToken), new Date());
  }

  private assertActive(user: User): void {
    if (user.status === UserStatus.Blocked) {
      throw AppException.forbidden(
        ErrorCode.UserBlocked,
        'This account has been blocked. Contact support.',
      );
    }
  }
}
