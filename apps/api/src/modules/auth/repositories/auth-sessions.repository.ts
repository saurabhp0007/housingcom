import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { AuthSession } from '../entities/auth-session.entity.js';
import type {
  AuthSessionsRepository,
  CreateSessionData,
} from '../interfaces/auth-sessions-repository.interface.js';

@Injectable()
export class TypeOrmAuthSessionsRepository implements AuthSessionsRepository {
  constructor(@InjectRepository(AuthSession) private readonly sessions: Repository<AuthSession>) {}

  create(data: CreateSessionData): Promise<AuthSession> {
    return this.sessions.save(this.sessions.create(data));
  }

  findActiveByHash(refreshTokenHash: string, now: Date): Promise<AuthSession | null> {
    return this.sessions.findOneBy({
      refreshTokenHash,
      revokedAt: IsNull(),
      expiresAt: MoreThan(now),
    });
  }

  async rotate(id: string, refreshTokenHash: string, expiresAt: Date, now: Date): Promise<void> {
    await this.sessions.update({ id }, { refreshTokenHash, expiresAt, lastUsedAt: now });
  }

  async revokeByHash(refreshTokenHash: string, now: Date): Promise<void> {
    await this.sessions.update({ refreshTokenHash, revokedAt: IsNull() }, { revokedAt: now });
  }

  async revokeForDevice(userId: string, deviceId: string, now: Date): Promise<void> {
    await this.sessions.update({ userId, deviceId, revokedAt: IsNull() }, { revokedAt: now });
  }

  async revokeAllForUser(userId: string, now: Date): Promise<void> {
    await this.sessions.update({ userId, revokedAt: IsNull() }, { revokedAt: now });
  }
}
