import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AuthProvider,
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
import type { VerifyOtpDto } from '../dto/otp.dto.js';
import {
  AUTH_SESSIONS_REPOSITORY,
  type AuthSessionsRepository,
} from '../interfaces/auth-sessions-repository.interface.js';
import { OTP_VERIFIER, type OtpVerifier } from '../interfaces/otp-verifier.interface.js';
import { TokenService } from './token.service.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(OTP_VERIFIER) private readonly otp: OtpVerifier,
    @Inject(AUTH_SESSIONS_REPOSITORY) private readonly sessions: AuthSessionsRepository,
    private readonly usersService: UsersService,
    private readonly tokens: TokenService,
    private readonly events: EventEmitter2,
  ) {}

  sendOtp(phone: string): Promise<void> {
    return this.otp.send(phone);
  }

  /** Exchanges a phone number + one-time code for our own session. */
  async loginWithOtp(dto: VerifyOtpDto): Promise<AuthSessionResponse> {
    if (!(await this.otp.verify(dto.phone, dto.code))) {
      throw AppException.unauthorized(ErrorCode.InvalidOtp, 'That code is incorrect.');
    }
    const { user, isNew } = await this.usersService.findOrCreateByIdentity({
      authUid: `phone:${dto.phone}`,
      phone: dto.phone,
      email: null,
      fullName: null,
      avatarUrl: null,
      authProvider: AuthProvider.Phone,
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
