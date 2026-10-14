import type { Platform } from '@housingcom/contracts';
import type { AuthSession } from '../entities/auth-session.entity.js';

export const AUTH_SESSIONS_REPOSITORY = Symbol('AUTH_SESSIONS_REPOSITORY');

export interface CreateSessionData {
  userId: string;
  refreshTokenHash: string;
  deviceId: string | null;
  platform: Platform | null;
  expiresAt: Date;
}

export interface AuthSessionsRepository {
  create(data: CreateSessionData): Promise<AuthSession>;
  findActiveByHash(refreshTokenHash: string, now: Date): Promise<AuthSession | null>;
  rotate(id: string, refreshTokenHash: string, expiresAt: Date, now: Date): Promise<void>;
  revokeByHash(refreshTokenHash: string, now: Date): Promise<void>;
  /** One session per device: logging in again on the same device replaces the old session. */
  revokeForDevice(userId: string, deviceId: string, now: Date): Promise<void>;
  revokeAllForUser(userId: string, now: Date): Promise<void>;
}
