import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  UserRole,
  VerificationDocument,
  type Paginated,
  type VerificationRequestResponse,
} from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser, RawResponse, Roles } from '../../../core/http/decorators/index.js';
import { RejectDto } from '../../listings/dto/listing-query.dto.js';
import { VerificationQueueQueryDto } from '../dto/verification.dto.js';
import { VerificationService } from '../services/verification.service.js';

@ApiTags('Admin · Verifications')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@Controller('admin/verifications')
export class AdminVerificationsController {
  constructor(private readonly verification: VerificationService) {}

  @Get()
  queue(@Query() q: VerificationQueueQueryDto): Promise<Paginated<VerificationRequestResponse>> {
    return this.verification.queue(q.status, q.page, q.limit);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<VerificationRequestResponse> {
    return this.verification.get(id);
  }

  /** Private document image (admins only; never exposed via public URLs). */
  @Get(':id/documents/:document')
  @RawResponse()
  document(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('document', new ParseEnumPipe(VerificationDocument)) document: VerificationDocument,
  ): Promise<StreamableFile> {
    return this.verification.openDocument(id, document);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(@CurrentUser() admin: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<VerificationRequestResponse> {
    return this.verification.approve(admin.id, id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectDto,
  ): Promise<VerificationRequestResponse> {
    return this.verification.reject(admin.id, id, dto.reason);
  }
}
