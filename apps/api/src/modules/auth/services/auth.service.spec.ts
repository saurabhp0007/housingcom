import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthProvider, UserRole, UserStatus } from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import type { User } from '../../users/entities/user.entity.js';
import type { UsersService } from '../../users/services/users.service.js';
import type { AuthSession } from '../entities/auth-session.entity.js';
import type { AuthSessionsRepository } from '../interfaces/auth-sessions-repository.interface.js';
import type { OtpVerifier } from '../interfaces/otp-verifier.interface.js';
import { AuthService } from './auth.service.js';
import { TokenService } from './token.service.js';

const config = {
  accessTokenSecret: 'x'.repeat(40),
  accessTokenTtlSeconds: 900,
  refreshTokenTtlDays: 30,
  staticOtp: '000000',
};

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    authUid: 'phone:+919876543210',
    phone: '+919876543210',
    email: null,
    fullName: null,
    avatarUrl: null,
    roles: [UserRole.Customer],
    status: UserStatus.Active,
    authProvider: AuthProvider.Phone,
    lastLoginAt: null,
    listerProfile: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

/** In-memory session store with the same semantics as the TypeORM repository. */
class FakeSessions implements AuthSessionsRepository {
  rows: AuthSession[] = [];
  async create(data: Parameters<AuthSessionsRepository['create']>[0]) {
    const row = {
      ...data,
      id: `s${this.rows.length + 1}`,
      revokedAt: null,
      lastUsedAt: null,
    } as AuthSession;
    this.rows.push(row);
    return row;
  }
  async findActiveByHash(hash: string, now: Date) {
    return (
      this.rows.find((r) => r.refreshTokenHash === hash && !r.revokedAt && r.expiresAt > now) ??
      null
    );
  }
  async rotate(id: string, hash: string, expiresAt: Date) {
    Object.assign(
      this.rows.find((r) => r.id === id)!,
      { refreshTokenHash: hash, expiresAt },
    );
  }
  async revokeByHash(hash: string, now: Date) {
    this.rows.filter((r) => r.refreshTokenHash === hash).forEach((r) => (r.revokedAt = now));
  }
  async revokeForDevice(userId: string, deviceId: string, now: Date) {
    this.rows
      .filter((r) => r.userId === userId && r.deviceId === deviceId)
      .forEach((r) => (r.revokedAt = now));
  }
  async revokeAllForUser(userId: string, now: Date) {
    this.rows.filter((r) => r.userId === userId).forEach((r) => (r.revokedAt = now));
  }
}

function setup(user = makeUser()) {
  const sessions = new FakeSessions();
  const otp: OtpVerifier = {
    send: vi.fn().mockResolvedValue(undefined),
    verify: vi.fn(async (_phone: string, code: string) => code === '000000'),
  };
  const users = {
    findOrCreateByIdentity: vi.fn().mockResolvedValue({ user, isNew: true }),
    getById: vi.fn().mockResolvedValue(user),
    registerDevice: vi.fn().mockResolvedValue(undefined),
    recordLogin: vi.fn().mockResolvedValue(undefined),
  } as unknown as UsersService;
  const tokens = new TokenService(new JwtService({ secret: config.accessTokenSecret }), config);
  const events = new EventEmitter2();
  const service = new AuthService(otp, sessions, users, tokens, events);
  return { service, sessions, tokens, users };
}

const credentials = { phone: '+919876543210', code: '000000' };

describe('AuthService', () => {
  it('logs in with a valid OTP and returns a session', async () => {
    const { service, sessions, tokens } = setup();
    const result = await service.loginWithOtp({
      ...credentials,
      device: { id: 'device-1', platform: 'android' },
    });

    expect(result.isNewUser).toBe(true);
    expect(result.user.phone).toBe('+919876543210');
    expect((await tokens.verifyAccessToken(result.accessToken)).sub).toBe('user-1');
    // Only the hash is stored, never the token itself.
    expect(sessions.rows[0]!.refreshTokenHash).toBe(tokens.hashRefreshToken(result.refreshToken));
    expect(sessions.rows[0]!.refreshTokenHash).not.toBe(result.refreshToken);
  });

  it('rotates refresh tokens and rejects reuse of the old one', async () => {
    const { service } = setup();
    const login = await service.loginWithOtp(credentials);

    const refreshed = await service.refresh(login.refreshToken);
    expect(refreshed.refreshToken).not.toBe(login.refreshToken);
    await expect(service.refresh(login.refreshToken)).rejects.toBeInstanceOf(AppException);
    await expect(service.refresh(refreshed.refreshToken)).resolves.toBeDefined();
  });

  it('replaces the previous session when logging in again on the same device', async () => {
    const { service } = setup();
    const first = await service.loginWithOtp({
      ...credentials,
      device: { id: 'd1', platform: 'ios' },
    });
    await service.loginWithOtp({ ...credentials, device: { id: 'd1', platform: 'ios' } });
    await expect(service.refresh(first.refreshToken)).rejects.toBeInstanceOf(AppException);
  });

  it('invalidates the session on logout', async () => {
    const { service } = setup();
    const login = await service.loginWithOtp(credentials);
    await service.logout(login.refreshToken);
    await expect(service.refresh(login.refreshToken)).rejects.toBeInstanceOf(AppException);
  });

  it('rejects a wrong code', async () => {
    const { service } = setup();
    await expect(service.loginWithOtp({ ...credentials, code: '123456' })).rejects.toMatchObject({
      code: 'AUTH_INVALID_OTP',
    });
  });

  it('refuses blocked users', async () => {
    const { service } = setup(makeUser({ status: UserStatus.Blocked }));
    await expect(service.loginWithOtp(credentials)).rejects.toMatchObject({
      code: 'AUTH_USER_BLOCKED',
    });
  });
});
