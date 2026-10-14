import { Inject, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Request } from 'express';
import { otaConfig } from '../../../config/configuration.js';
import { AppException } from '../../../core/errors/app.exception.js';
import { safeEqual } from '../../../core/utils/crypto.util.js';

/** Protects publish/rollout endpoints with the OTA admin token (console + CI). */
@Injectable()
export class OtaAdminGuard implements CanActivate {
  constructor(@Inject(otaConfig.KEY) private readonly config: ConfigType<typeof otaConfig>) {}

  canActivate(context: ExecutionContext): boolean {
    const [scheme, token] =
      context.switchToHttp().getRequest<Request>().headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token || !safeEqual(token, this.config.adminToken)) {
      throw AppException.unauthorized();
    }
    return true;
  }
}
