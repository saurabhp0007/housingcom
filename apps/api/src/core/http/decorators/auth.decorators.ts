import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserRole } from '@housingcom/contracts';
import type { AuthUser } from '../../auth/auth-user.js';

export const IS_PUBLIC_KEY = 'auth:public';
export const IS_OPTIONAL_AUTH_KEY = 'auth:optional';
export const ROLES_KEY = 'auth:roles';

/** No authentication required. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Guests allowed; the user is attached when a valid token is sent (e.g. personalised feeds). */
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);

/** Requires at least one of the given roles. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    return ctx.switchToHttp().getRequest<Request>().user;
  },
);
