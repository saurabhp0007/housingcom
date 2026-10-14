import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRole, type ListerType, type UserResponse } from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import {
  DomainEvent,
  type UserBecameListerEvent,
  type UserRegisteredEvent,
} from '../../../core/events/domain-events.js';
import type { User } from '../entities/user.entity.js';
import {
  USERS_REPOSITORY,
  type CreateUserData,
  type PushAudience,
  type PushTarget,
  type UpsertDeviceData,
  type UsersRepository,
} from '../interfaces/users-repository.interface.js';
import { toUserResponse } from '../mappers/user.mapper.js';
import type { UpdateProfileDto } from '../dto/update-profile.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    private readonly events: EventEmitter2,
  ) {}

  async getById(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) throw AppException.notFound('User');
    return user;
  }

  async getProfile(id: string): Promise<UserResponse> {
    return toUserResponse(await this.getById(id));
  }

  /** Used by auth: returns the existing user for this identity or registers a new one. */
  async findOrCreateByIdentity(data: CreateUserData): Promise<{ user: User; isNew: boolean }> {
    const existing = await this.users.findByFirebaseUid(data.firebaseUid);
    if (existing) return { user: existing, isNew: false };

    const created = await this.users.create(data);
    this.events.emit(DomainEvent.UserRegistered, {
      userId: created.id,
      provider: data.authProvider,
    } satisfies UserRegisteredEvent);
    return { user: created, isNew: true };
  }

  recordLogin(id: string): Promise<void> {
    return this.users.touchLastLogin(id, new Date());
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<UserResponse> {
    await this.getById(id);
    await this.users.updateProfile(id, dto);
    return this.getProfile(id);
  }

  async becomeLister(
    id: string,
    listerType: ListerType,
    businessName?: string,
  ): Promise<UserResponse> {
    const user = await this.getById(id);
    if (user.listerProfile)
      throw AppException.conflict(ErrorCode.AlreadyLister, 'Already in lister mode');

    const roles = Array.from(new Set([...user.roles, UserRole.Lister]));
    await this.users.becomeLister(id, listerType, businessName ?? null, roles);
    this.events.emit(DomainEvent.UserBecameLister, {
      userId: id,
      listerType,
    } satisfies UserBecameListerEvent);
    return this.getProfile(id);
  }

  registerDevice(data: UpsertDeviceData): Promise<void> {
    return this.users.upsertDevice(data);
  }

  setListerVerified(userId: string, verifiedAt: Date | null): Promise<void> {
    return this.users.setListerVerified(userId, verifiedAt);
  }

  /** Users keyed by id, for other modules building people summaries in bulk. */
  async findMany(ids: string[]): Promise<Map<string, User>> {
    const users = await this.users.findManyByIds([...new Set(ids)]);
    return new Map(users.map((u) => [u.id, u]));
  }

  pushTokensForUsers(userIds: string[]): Promise<string[]> {
    return this.users.pushTokensForUsers([...new Set(userIds)]);
  }

  pushTokensPage(
    audience: PushAudience,
    afterDeviceId: string | null,
    limit: number,
  ): Promise<PushTarget[]> {
    return this.users.pushTokensPage(audience, afterDeviceId, limit);
  }

  clearPushTokens(tokens: string[]): Promise<void> {
    return this.users.clearPushTokens(tokens);
  }
}
