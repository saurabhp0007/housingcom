import type { VerificationRequestResponse } from '@housingcom/contracts';
import type { VerificationRequest } from '../entities/verification-request.entity.js';

export function toVerificationResponse(
  r: VerificationRequest,
  includeUser = false,
): VerificationRequestResponse {
  return {
    id: r.id,
    status: r.status,
    rejectionReason: r.rejectionReason,
    createdAt: r.createdAt.toISOString(),
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
    ...(includeUser && r.user
      ? {
          user: {
            id: r.user.id,
            name: r.user.fullName,
            phone: r.user.phone,
            listerType: r.user.listerProfile?.type ?? null,
          },
        }
      : {}),
  };
}
