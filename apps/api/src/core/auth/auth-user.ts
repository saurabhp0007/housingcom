import type { UserRole } from '@housingcom/contracts';

/** Identity attached to the request by the access-token guard. */
export interface AuthUser {
  id: string;
  roles: UserRole[];
}

export interface AccessTokenPayload {
  sub: string;
  roles: UserRole[];
}

declare module 'express' {
  interface Request {
    user?: AuthUser;
    id?: string;
  }
}
