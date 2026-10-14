import type { ListerType, UserRole, UserStatus } from '../enums/user.enums.js';

export interface UserResponse {
  id: string;
  phone: string | null;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  roles: UserRole[];
  status: UserStatus;
  lister: ListerProfileResponse | null;
  createdAt: string;
}

export interface ListerProfileResponse {
  type: ListerType;
  businessName: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  /** Access token lifetime in seconds. */
  expiresIn: number;
}

export interface AuthSessionResponse extends AuthTokensResponse {
  user: UserResponse;
  isNewUser: boolean;
}
