import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole, type Paginated, type ReportResponse } from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser, Roles } from '../../../core/http/decorators/index.js';
import {
  DismissReportDto,
  RemoveReportedListingDto,
  ReportQueueQueryDto,
} from '../dto/report.dto.js';
import { ReportsService } from '../services/reports.service.js';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  queue(@Query() q: ReportQueueQueryDto): Promise<Paginated<ReportResponse>> {
    return this.reports.queue(q.status, q.page, q.limit);
  }

  @Post(':id/dismiss')
  dismiss(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DismissReportDto,
  ): Promise<ReportResponse> {
    return this.reports.dismiss(admin.id, id, dto.note);
  }

  /** Takes the listing down; the owner sees the reason and can fix and resubmit. */
  @Post(':id/remove-listing')
  removeListing(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RemoveReportedListingDto,
  ): Promise<ReportResponse> {
    return this.reports.removeListing(admin.id, id, dto.reason);
  }
}
