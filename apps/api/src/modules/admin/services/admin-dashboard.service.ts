import { Injectable } from '@nestjs/common';
import { ListingStatus, type AdminDashboardResponse } from '@housingcom/contracts';
import { ListingsStatsService } from '../../listings/services/listings-stats.service.js';
import { UsersAdminService } from '../../users/services/users-admin.service.js';
import { VerificationService } from '../../verification/services/verification.service.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Aggregates the admin dashboard tiles from each feature module. */
@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly users: UsersAdminService,
    private readonly listings: ListingsStatsService,
    private readonly verification: VerificationService,
  ) {}

  async summary(): Promise<AdminDashboardResponse> {
    const [userCounts, byStatus, pendingVerifications] = await Promise.all([
      this.users.counts(new Date(Date.now() - WEEK_MS)),
      this.listings.countByStatus(),
      this.verification.countPending(),
    ]);
    return {
      users: {
        total: userCounts.total,
        listers: userCounts.listers,
        newLast7Days: userCounts.newSince,
      },
      listings: {
        live: byStatus[ListingStatus.Live] ?? 0,
        pendingApproval: byStatus[ListingStatus.PendingApproval] ?? 0,
        rejected: byStatus[ListingStatus.Rejected] ?? 0,
        total: Object.values(byStatus).reduce((a, b) => a + (b ?? 0), 0),
      },
      verifications: { pending: pendingVerifications },
    };
  }
}
