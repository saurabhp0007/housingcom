import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { ListerType, UserRole } from '@housingcom/contracts';
import { ListerProfile } from '../entities/lister-profile.entity.js';
import { UserDevice } from '../entities/user-device.entity.js';
import { User } from '../entities/user.entity.js';
import type {
  CreateUserData,
  UpsertDeviceData,
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
}
