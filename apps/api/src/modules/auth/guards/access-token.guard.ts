import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import { IS_OPTIONAL_AUTH_KEY, IS_PUBLIC_KEY } from '../../../core/http/decorators/index.js';
import { TokenService } from '../services/token.service.js';
import { UserBlocklistService } from '../services/user-blocklist.service.js';

/** Global guard: every route requires a valid access token unless marked @Public / @OptionalAuth. */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly blocklist: UserBlocklistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;
    const optional = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, targets);

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearer(request);
    if (!token) {
      if (optional) return true;
      throw AppException.unauthorized();
    }

    let payload;
    try {
      payload = await this.tokens.verifyAccessToken(token);
    } catch {
      if (optional) return true;
      throw AppException.unauthorized();
    }

    if (await this.blocklist.isBlocked(payload.sub)) {
      throw AppException.forbidden(ErrorCode.UserBlocked, 'This account has been blocked. Contact support.');
    }
    request.user = { id: payload.sub, roles: payload.roles };
    return true;
  }

  private extractBearer(request: Request): string | null {
    const [scheme, value] = request.headers.authorization?.split(' ') ?? [];
    return scheme === 'Bearer' && value ? value : null;
  }
}
