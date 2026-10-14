import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  UserRole,
  type LeadResponse,
  type Paginated,
  type VisitResponse,
} from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser, Roles } from '../../../core/http/decorators/index.js';
import { PageQueryDto } from '../../../core/http/dto/page-query.dto.js';
import { RespondVisitDto } from '../dto/leads.dto.js';
import { LeadsService } from '../services/leads.service.js';

@ApiTags('Leads')
@ApiBearerAuth()
@Controller('me')
export class MyVisitsController {
  constructor(private readonly leads: LeadsService) {}

  /** Visits I asked for (customer side). */
  @Get('visits')
  myVisits(
    @CurrentUser() user: AuthUser,
    @Query() q: PageQueryDto,
  ): Promise<Paginated<VisitResponse>> {
    return this.leads.myVisits(user.id, q.page, q.limit);
  }

  @Post('visits/:id/cancel')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VisitResponse> {
    return this.leads.cancelVisit(user.id, id);
  }

  /** Lister inbox: customers who reached out about my listings. */
  @Get('leads')
  @Roles(UserRole.Lister)
  ownerLeads(
    @CurrentUser() user: AuthUser,
    @Query() q: PageQueryDto,
  ): Promise<Paginated<LeadResponse>> {
    return this.leads.ownerLeads(user.id, q.page, q.limit);
  }

  @Post('leads/visits/:id/respond')
  @Roles(UserRole.Lister)
  respond(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondVisitDto,
  ): Promise<VisitResponse> {
    return this.leads.respondVisit(user.id, id, dto);
  }
}
