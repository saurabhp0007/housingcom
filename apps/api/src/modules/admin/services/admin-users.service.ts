import { Injectable } from '@nestjs/common';
import type { AdminUserResponse, Paginated } from '@housingcom/contracts';
import { ListingsStatsService } from '../../listings/services/listings-stats.service.js';
import { UsersAdminService } from '../../users/services/users-admin.service.js';
import type { AdminUsersQueryDto } from '../dto/admin-users-query.dto.js';
import { toAdminUserResponse } from '../mappers/admin-user.mapper.js';

/** Composes user search with per-user listing counts (two modules, no cross-module SQL). */
@Injectable()
export class AdminUsersService {
  constructor(
    private readonly users: UsersAdminService,
    private readonly listings: ListingsStatsService,
  ) {}

  async search(q: AdminUsersQueryDto): Promise<Paginated<AdminUserResponse>> {
    const page = await this.users.search(q);
    const counts = await this.listings.countByOwner(page.items.map((u) => u.id));
    return {
      items: page.items.map((u) => toAdminUserResponse(u, counts.get(u.id) ?? 0)),
      meta: page.meta,
    };
  }

  async setBlocked(adminId: string, userId: string, blocked: boolean): Promise<AdminUserResponse> {
    const user = await this.users.setBlocked(adminId, userId, blocked);
    const counts = await this.listings.countByOwner([user.id]);
    return toAdminUserResponse(user, counts.get(user.id) ?? 0);
  }
}
