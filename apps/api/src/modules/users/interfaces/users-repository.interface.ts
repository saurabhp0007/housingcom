import type { AuthProvider, ListerType, Platform, UserRole } from '@housingcom/contracts';
import type { User } from '../entities/user.entity.js';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface CreateUserData {
  firebaseUid: string;
  phone: string | null;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  authProvider: AuthProvider;
}

export interface UpsertDeviceData {
  userId: string;
  deviceId: string;
  platform: Platform;
  pushToken?: string | null;
}

export interface UsersRepository {
  /** Loads the user with their lister profile. */
  findById(id: string): Promise<User | null>;
  findByFirebaseUid(firebaseUid: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  updateProfile(
    id: string,
    data: Partial<Pick<User, 'fullName' | 'email' | 'avatarUrl'>>,
  ): Promise<void>;
  touchLastLogin(id: string, at: Date): Promise<void>;
  /** Adds the lister role and creates the lister profile atomically. */
  becomeLister(
    id: string,
    type: ListerType,
    businessName: string | null,
    roles: UserRole[],
  ): Promise<void>;
  upsertDevice(data: UpsertDeviceData): Promise<void>;
}
