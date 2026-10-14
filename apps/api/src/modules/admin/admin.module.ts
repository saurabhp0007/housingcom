import { Module } from '@nestjs/common';
import { ListingsModule } from '../listings/listings.module.js';
import { ReportsModule } from '../reports/reports.module.js';
import { UsersModule } from '../users/users.module.js';
import { VerificationModule } from '../verification/verification.module.js';
import { AdminController } from './controllers/admin.controller.js';
import { AdminDashboardService } from './services/admin-dashboard.service.js';
import { AdminUsersService } from './services/admin-users.service.js';

/**
 * Cross-cutting admin views. Feature-specific admin endpoints (listing moderation,
 * verifications, cities/areas) live in their own modules under /admin/*.
 */
@Module({
  imports: [UsersModule, ListingsModule, VerificationModule, ReportsModule],
  controllers: [AdminController],
  providers: [AdminDashboardService, AdminUsersService],
})
export class AdminModule {}
