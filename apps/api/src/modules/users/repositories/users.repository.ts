import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { UserRole, UserStatus, type ListerType, type Paginated } from '@housingcom/contracts';
import { buildPaginationMeta } from '../../../core/utils/pagination.util.js';
import { ListerProfile } from '../entities/lister-profile.entity.js';
import { UserDevice } from '../entities/user-device.entity.js';
import { User } from '../entities/user.entity.js';
import type {
  CreateUserData,
  PushAudience,
  PushTarget,
  UpsertDeviceData,
  UserCounts,
  UserSearchFilter,
  UsersRepository,
} from '../interfaces/users-repository.interface.js';

@Injectable()
export class TypeOrmUsersRepository implements UsersRepository {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserDevice) private readonly devices: Repository<UserDevice>,
    private readonly dataSource: DataSource,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id }, relations: { listerProfile: true } });
  }

  findByAuthUid(authUid: string): Promise<User | null> {
    return this.users.findOne({ where: { authUid }, relations: { listerProfile: true } });
  }

  create(data: CreateUserData): Promise<User> {
    return this.users.save(this.users.create(data));
  }

  async updateProfile(
    id: string,
    data: Partial<Pick<User, 'fullName' | 'email' | 'avatarUrl' | 'preferredCityId'>>,
  ): Promise<void> {
    await this.users.update({ id }, data);
  }

  async touchLastLogin(id: string, at: Date): Promise<void> {
    await this.users.update({ id }, { lastLoginAt: at });
  }

  async becomeLister(
    id: string,
    type: ListerType,
    businessName: string | null,
    roles: UserRole[],
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.update(User, { id }, { roles });
      await manager.insert(ListerProfile, { userId: id, type, businessName });
    });
  }

  async upsertDevice(data: UpsertDeviceData): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      if (data.pushToken) {
        // A phone that switched accounts must stop receiving the previous user's pushes.
        await manager
          .createQueryBuilder()
          .update(UserDevice)
          .set({ pushToken: null })
          .where('push_token = :token AND NOT (user_id = :userId AND device_id = :deviceId)', {
            token: data.pushToken,
            userId: data.userId,
            deviceId: data.deviceId,
          })
          .execute();
      }
      await manager.upsert(
        UserDevice,
        {
          userId: data.userId,
          deviceId: data.deviceId,
          platform: data.platform,
          // Omitted (not nulled) when absent, so a login doesn't wipe the registered token.
          ...(data.pushToken !== undefined ? { pushToken: data.pushToken } : {}),
          lastSeenAt: new Date(),
        },
        { conflictPaths: ['userId', 'deviceId'] },
      );
    });
  }

  findManyByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.users.find({ where: { id: In(ids) } });
  }

  async pushTokensForUsers(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];
    const rows = await this.devices
      .createQueryBuilder('d')
      .innerJoin('d.user', 'u')
      .select('d.push_token', 'token')
      .where('d.user_id IN (:...userIds)', { userIds })
      .andWhere('d.push_token IS NOT NULL')
      .andWhere('u.status = :active', { active: UserStatus.Active })
      .getRawMany<{ token: string }>();
    return [...new Set(rows.map((r) => r.token))];
  }

  async pushTokensPage(
    audience: PushAudience,
    afterDeviceId: string | null,
    limit: number,
  ): Promise<PushTarget[]> {
    const qb = this.devices
      .createQueryBuilder('d')
      .innerJoin('d.user', 'u')
      .select('d.id', 'deviceId')
      .addSelect('d.push_token', 'token')
      .where('d.push_token IS NOT NULL')
      .andWhere('u.status = :active', { active: UserStatus.Active })
      .orderBy('d.id', 'ASC')
      .limit(limit);
    if (audience.cityId) qb.andWhere('u.preferred_city_id = :cityId', { cityId: audience.cityId });
    if (afterDeviceId) qb.andWhere('d.id > :after', { after: afterDeviceId });
    return qb.getRawMany<PushTarget>();
  }

  async clearPushTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.devices.update({ pushToken: In(tokens) }, { pushToken: null });
  }

  async setListerVerified(userId: string, verifiedAt: Date | null): Promise<void> {
    await this.dataSource
      .getRepository(ListerProfile)
      .update({ userId }, { isVerified: verifiedAt !== null, verifiedAt });
  }

  async setStatus(id: string, status: UserStatus): Promise<void> {
    await this.users.update({ id }, { status });
  }

  async search({ q, role, status, page, limit }: UserSearchFilter): Promise<Paginated<User>> {
    const qb = this.users
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.listerProfile', 'listerProfile')
      .orderBy('user.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (role) qb.andWhere(':role = ANY(user.roles)', { role });
    if (status) qb.andWhere('user.status = :status', { status });
    if (q) {
      const like = `%${q.replace(/[%_\\]/g, '\\$&')}%`;
      qb.andWhere(
        new Brackets((w) =>
          w
            .where('user.full_name ILIKE :like', { like })
            .orWhere('user.phone ILIKE :like', { like })
            .orWhere('user.email ILIKE :like', { like }),
        ),
      );
    }
    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async counts(since: Date): Promise<UserCounts> {
    const row = await this.users
      .createQueryBuilder('user')
      .select('COUNT(*)', 'total')
      .addSelect(`COUNT(*) FILTER (WHERE :lister = ANY(user.roles))`, 'listers')
      .addSelect('COUNT(*) FILTER (WHERE user.created_at >= :since)', 'new_since')
      .setParameters({ lister: UserRole.Lister, since })
      .getRawOne<{ total: string; listers: string; new_since: string }>();
    return {
      total: Number(row?.total ?? 0),
      listers: Number(row?.listers ?? 0),
      newSince: Number(row?.new_since ?? 0),
    };
  }
}
