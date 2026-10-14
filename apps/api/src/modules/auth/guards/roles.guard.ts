import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { UserRole } from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { ROLES_KEY } from '../../../core/http/decorators/index.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest<Request>().user;
    if (!user) throw AppException.unauthorized();
    if (!required.some((role) => user.roles.includes(role))) throw AppException.forbidden();
    return true;
  }
}
