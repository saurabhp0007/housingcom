import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module.js';
import { AdminVerificationsController } from './controllers/admin-verifications.controller.js';
import { VerificationController } from './controllers/verification.controller.js';
import { VerificationRequest } from './entities/verification-request.entity.js';
import { VERIFICATION_REPOSITORY } from './interfaces/verification-repository.interface.js';
import { TypeOrmVerificationRepository } from './repositories/verification.repository.js';
import { VerificationService } from './services/verification.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationRequest]),
    MulterModule.register({ limits: { fileSize: 15 * 1024 * 1024, files: 2 } }),
    UsersModule,
  ],
  controllers: [VerificationController, AdminVerificationsController],
  providers: [
    VerificationService,
    { provide: VERIFICATION_REPOSITORY, useClass: TypeOrmVerificationRepository },
  ],
  exports: [VerificationService],
})
export class VerificationModule {}
