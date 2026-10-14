import type { Paginated, VerificationStatus } from '@housingcom/contracts';
import type { VerificationRequest } from '../entities/verification-request.entity.js';

export const VERIFICATION_REPOSITORY = Symbol('VERIFICATION_REPOSITORY');

export interface VerificationRepository {
  create(
    data: Pick<VerificationRequest, 'userId' | 'idDocumentKey' | 'propertyDocumentKey'>,
  ): Promise<VerificationRequest>;
  findById(id: string): Promise<VerificationRequest | null>;
  findLatestForUser(userId: string): Promise<VerificationRequest | null>;
  hasPending(userId: string): Promise<boolean>;
  /** With the user (and lister profile) joined, oldest first. */
  findByStatus(
    status: VerificationStatus,
    page: number,
    limit: number,
  ): Promise<Paginated<VerificationRequest>>;
  countByStatus(status: VerificationStatus): Promise<number>;
  review(
    id: string,
    data: Pick<VerificationRequest, 'status' | 'reviewedBy' | 'reviewedAt' | 'rejectionReason'>,
  ): Promise<void>;
}
