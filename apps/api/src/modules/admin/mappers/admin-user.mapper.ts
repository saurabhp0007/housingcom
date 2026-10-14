import type { AdminUserResponse } from '@housingcom/contracts';
import type { User } from '../../users/entities/user.entity.js';

export const toAdminUserResponse = (u: User, listingCount: number): AdminUserResponse => ({
  id: u.id,
  name: u.fullName,
  phone: u.phone,
  email: u.email,
  roles: u.roles,
  status: u.status,
  isVerifiedLister: u.listerProfile?.isVerified ?? false,
  listingCount,
  createdAt: u.createdAt.toISOString(),
  lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
});
