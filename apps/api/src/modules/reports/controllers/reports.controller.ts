import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser } from '../../../core/http/decorators/index.js';
import { ReportListingDto } from '../dto/report.dto.js';
import { ReportsService } from '../services/reports.service.js';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('listings/:listingId/reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  report(
    @CurrentUser() user: AuthUser,
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Body() dto: ReportListingDto,
  ): Promise<void> {
    return this.reports.report(user.id, listingId, dto);
  }
}
