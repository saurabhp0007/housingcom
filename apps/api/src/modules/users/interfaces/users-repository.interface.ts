import type {
  AuthProvider,
  ListerType,
  Paginated,
  Platform,
  UserRole,
  UserStatus,
} from '@housingcom/contracts';
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

export interface UserSearchFilter {
  q?: string;
  role?: UserRole;
  status?: UserStatus;
  page: number;
  limit: number;
}

export interface UserCounts {
  total: number;
  listers: number;
  newSince: number;
}

export interface UsersRepository {
  /** Loads the user with their lister profile. */
  findById(id: string): Promise<User | null>;
  findByFirebaseUid(firebaseUid: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  updateProfile(
    id: string,
    data: Partial<Pick<User, 'fullName' | 'email' | 'avatarUrl' | 'preferredCityId'>>,
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
  setListerVerified(userId: string, verifiedAt: Date | null): Promise<void>;
  setStatus(id: string, status: UserStatus): Promise<void>;
  search(filter: UserSearchFilter): Promise<Paginated<User>>;
  counts(since: Date): Promise<UserCounts>;
  findManyByIds(ids: string[]): Promise<User[]>;
  /** Push tokens of the given users' devices. */
  pushTokensForUsers(userIds: string[]): Promise<string[]>;
  /** Keyset page of push tokens for a broadcast audience (all active users, or one city). */
  pushTokensPage(
    audience: PushAudience,
    afterDeviceId: string | null,
    limit: number,
  ): Promise<PushTarget[]>;
  /** Forgets tokens Expo reports as no longer registered. */
  clearPushTokens(tokens: string[]): Promise<void>;
}

export interface PushAudience {
  cityId: string | null;
}

export interface PushTarget {
  deviceId: string;
  token: string;
}
