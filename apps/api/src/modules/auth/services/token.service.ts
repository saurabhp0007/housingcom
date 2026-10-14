import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { UserRole } from '@housingcom/contracts';
import { authConfig } from '../../../config/configuration.js';
import type { AccessTokenPayload } from '../../../core/auth/auth-user.js';
import { randomToken, sha256Hex } from '../../../core/utils/crypto.util.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface IssuedRefreshToken {
  token: string;
  hash: string;
  expiresAt: Date;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(authConfig.KEY) private readonly config: ConfigType<typeof authConfig>,
  ) {}

  get accessTokenTtlSeconds(): number {
    return this.config.accessTokenTtlSeconds;
  }

  signAccessToken(userId: string, roles: UserRole[]): Promise<string> {
    const payload: AccessTokenPayload = { sub: userId, roles };
    return this.jwt.signAsync(payload);
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwt.verifyAsync<AccessTokenPayload>(token);
  }

  /** Opaque random refresh token; only its hash is persisted. */
  issueRefreshToken(now = new Date()): IssuedRefreshToken {
    const token = randomToken();
    return {
      token,
      hash: this.hashRefreshToken(token),
      expiresAt: new Date(now.getTime() + this.config.refreshTokenTtlDays * DAY_MS),
    };
  }

  hashRefreshToken(token: string): string {
    return sha256Hex(token);
  }
}
