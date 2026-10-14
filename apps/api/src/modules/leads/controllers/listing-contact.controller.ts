import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { ContactOwnerResponse, VisitResponse } from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser } from '../../../core/http/decorators/index.js';
import { ContactOwnerDto, RequestVisitDto } from '../dto/leads.dto.js';
import { LeadsService } from '../services/leads.service.js';

/** Signed-in only: guests see "Log in to contact" in the app. */
@ApiTags('Leads')
@ApiBearerAuth()
@Controller('listings/:listingId')
export class ListingContactController {
  constructor(private readonly leads: LeadsService) {}

  /** Returns the owner's phone (call / WhatsApp) or a chat thread id. */
  @Post('contact')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  contact(
    @CurrentUser() user: AuthUser,
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Body() dto: ContactOwnerDto,
  ): Promise<ContactOwnerResponse> {
    return this.leads.contact(user.id, listingId, dto.channel);
  }

  @Post('visits')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  requestVisit(
    @CurrentUser() user: AuthUser,
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Body() dto: RequestVisitDto,
  ): Promise<VisitResponse> {
    return this.leads.requestVisit(user.id, listingId, dto);
  }
}
