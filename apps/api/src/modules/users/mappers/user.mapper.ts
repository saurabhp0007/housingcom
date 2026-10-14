import type { UserResponse } from '@housingcom/contracts';
import type { User } from '../entities/user.entity.js';

export function toUserResponse(user: User): UserResponse {
  const lister = user.listerProfile;
  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    roles: user.roles,
    status: user.status,
    lister: lister
      ? {
          type: lister.type,
          businessName: lister.businessName,
          isVerified: lister.isVerified,
          verifiedAt: lister.verifiedAt?.toISOString() ?? null,
        }
      : null,
    preferredCityId: user.preferredCityId,
    createdAt: user.createdAt.toISOString(),
  };
}
