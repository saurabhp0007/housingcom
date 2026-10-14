import { Controller, Get, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole, type MyVerificationResponse } from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import { CurrentUser, Roles } from '../../../core/http/decorators/index.js';
import { VerificationService } from '../services/verification.service.js';

interface VerificationFiles {
  idProof?: Express.Multer.File[];
  propertyProof?: Express.Multer.File[];
}

@ApiTags('Verification')
@ApiBearerAuth()
@Roles(UserRole.Lister)
@Controller('me/verification')
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Get()
  status(@CurrentUser() user: AuthUser): Promise<MyVerificationResponse> {
    return this.verification.mine(user.id);
  }

  /** Multipart: `idProof` (Aadhaar/PAN/DL photo) and `propertyProof` (bill/agreement photo). */
  @Post()
  @ApiConsumes('multipart/form-data')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'idProof', maxCount: 1 },
      { name: 'propertyProof', maxCount: 1 },
    ]),
  )
  submit(@CurrentUser() user: AuthUser, @UploadedFiles() files: VerificationFiles): Promise<MyVerificationResponse> {
    const idProof = files?.idProof?.[0];
    const propertyProof = files?.propertyProof?.[0];
    if (!idProof || !propertyProof) {
      throw AppException.badRequest(ErrorCode.InvalidMedia, 'Attach both idProof and propertyProof');
    }
    return this.verification.submit(user.id, idProof, propertyProof);
  }
}
