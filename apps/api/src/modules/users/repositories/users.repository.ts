import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { UserRole, type ListerType, type Paginated, type UserStatus } from '@housingcom/contracts';
import { buildPaginationMeta } from '../../../core/utils/pagination.util.js';
import { ListerProfile } from '../entities/lister-profile.entity.js';
import { UserDevice } from '../entities/user-device.entity.js';
import { User } from '../entities/user.entity.js';
import type {
  CreateUserData,
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

  findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.users.findOne({ where: { firebaseUid }, relations: { listerProfile: true } });
  }

  create(data: CreateUserData): Promise<User> {
    return this.users.save(this.users.create(data));
  }

  async updateProfile(
    id: string,
    data: Partial<Pick<User, 'fullName' | 'email' | 'avatarUrl'>>,
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
    await this.devices.upsert(
      {
        userId: data.userId,
        deviceId: data.deviceId,
        platform: data.platform,
        pushToken: data.pushToken ?? null,
        lastSeenAt: new Date(),
      },
      { conflictPaths: ['userId', 'deviceId'] },
    );
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
