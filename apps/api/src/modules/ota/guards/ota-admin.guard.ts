import { Inject, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Request } from 'express';
import { UserRole } from '@housingcom/contracts';
import { otaConfig } from '../../../config/configuration.js';
import { AppException } from '../../../core/errors/app.exception.js';
import { safeEqual } from '../../../core/utils/crypto.util.js';
import { TokenService } from '../../auth/services/token.service.js';
import { UserBlocklistService } from '../../auth/services/user-blocklist.service.js';

/**
 * Publish/rollout endpoints accept either:
 * - an admin's normal access token (the in-app Admin → App updates screen), or
 * - the OTA admin token (`pnpm ota:publish` / curl from a terminal).
 */
@Injectable()
export class OtaAdminGuard implements CanActivate {
  constructor(
    @Inject(otaConfig.KEY) private readonly config: ConfigType<typeof otaConfig>,
    private readonly tokens: TokenService,
    private readonly blocklist: UserBlocklistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw AppException.unauthorized();

    if (safeEqual(token, this.config.adminToken)) return true;

    try {
      const payload = await this.tokens.verifyAccessToken(token);
      if (
        payload.roles.includes(UserRole.Admin) &&
        !(await this.blocklist.isBlocked(payload.sub))
      ) {
        request.user = { id: payload.sub, roles: payload.roles };
        return true;
      }
    } catch {
      // fall through
    }
    throw AppException.unauthorized();
  }
}
