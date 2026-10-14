import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Redis } from 'ioredis';
import { authConfig } from '../../../config/configuration.js';
import { REDIS_CLIENT } from '../../../core/redis/redis.constants.js';

const key = (userId: string) => `auth:blocked:${userId}`;

/**
 * Makes a block take effect immediately: refresh sessions are revoked, and access tokens
 * still in their (short) lifetime are rejected by the guard via this Redis flag.
 */
@Injectable()
export class UserBlocklistService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(authConfig.KEY) private readonly config: ConfigType<typeof authConfig>,
  ) {}

  async block(userId: string): Promise<void> {
    // Only needs to outlive the longest-lived access token.
    await this.redis.set(key(userId), '1', 'EX', this.config.accessTokenTtlSeconds + 60);
  }

  async unblock(userId: string): Promise<void> {
    await this.redis.del(key(userId));
  }

  async isBlocked(userId: string): Promise<boolean> {
    try {
      return (await this.redis.exists(key(userId))) === 1;
    } catch {
      // Redis outage must not lock everyone out; refresh-time checks still apply.
      return false;
    }
  }
}
