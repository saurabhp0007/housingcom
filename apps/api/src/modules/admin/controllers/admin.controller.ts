import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  UserRole,
  type AdminDashboardResponse,
  type AdminUserResponse,
  type Paginated,
} from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser, Roles } from '../../../core/http/decorators/index.js';
import { AdminUsersQueryDto } from '../dto/admin-users-query.dto.js';
import { AdminDashboardService } from '../services/admin-dashboard.service.js';
import { AdminUsersService } from '../services/admin-users.service.js';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly dashboard: AdminDashboardService,
    private readonly users: AdminUsersService,
  ) {}

  @Get('dashboard')
  summary(): Promise<AdminDashboardResponse> {
    return this.dashboard.summary();
  }

  @Get('users')
  searchUsers(@Query() q: AdminUsersQueryDto): Promise<Paginated<AdminUserResponse>> {
    return this.users.search(q);
  }

  /** Blocks immediately: sessions revoked and live access tokens rejected. */
  @Post('users/:id/block')
  @HttpCode(HttpStatus.OK)
  block(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminUserResponse> {
    return this.users.setBlocked(admin.id, id, true);
  }

  @Post('users/:id/unblock')
  @HttpCode(HttpStatus.OK)
  unblock(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminUserResponse> {
    return this.users.setBlocked(admin.id, id, false);
  }
}
