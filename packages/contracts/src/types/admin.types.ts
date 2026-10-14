import type { VerificationStatus } from '../enums/verification.enums.js';
import type { ListerType, UserRole, UserStatus } from '../enums/user.enums.js';

export interface AdminDashboardResponse {
  users: { total: number; listers: number; newLast7Days: number };
  listings: { live: number; pendingApproval: number; rejected: number; total: number };
  verifications: { pending: number };
  reports: { open: number };
}

export interface VerificationRequestResponse {
  id: string;
  status: VerificationStatus;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  /** Admin views only. */
  user?: { id: string; name: string | null; phone: string | null; listerType: ListerType | null };
}

export interface MyVerificationResponse {
  isVerified: boolean;
  latest: VerificationRequestResponse | null;
}

export interface AdminUserResponse {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  roles: UserRole[];
  status: UserStatus;
  isVerifiedLister: boolean;
  listingCount: number;
  createdAt: string;
  lastLoginAt: string | null;
}
