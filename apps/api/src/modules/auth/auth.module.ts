import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { authConfig } from '../../config/configuration.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './controllers/auth.controller.js';
import { AuthSession } from './entities/auth-session.entity.js';
import { FirebaseIdentityVerifier } from './firebase/firebase-identity.verifier.js';
import { AccessTokenGuard } from './guards/access-token.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { AUTH_SESSIONS_REPOSITORY } from './interfaces/auth-sessions-repository.interface.js';
import { IDENTITY_VERIFIER } from './interfaces/identity-verifier.interface.js';
import { TypeOrmAuthSessionsRepository } from './repositories/auth-sessions.repository.js';
import { AuthService } from './services/auth.service.js';
import { TokenService } from './services/token.service.js';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([AuthSession]),
    JwtModule.registerAsync({
      inject: [authConfig.KEY],
      useFactory: (config: ConfigType<typeof authConfig>) => ({
        secret: config.accessTokenSecret,
        signOptions: { expiresIn: config.accessTokenTtlSeconds },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    { provide: IDENTITY_VERIFIER, useClass: FirebaseIdentityVerifier },
    { provide: AUTH_SESSIONS_REPOSITORY, useClass: TypeOrmAuthSessionsRepository },
    // Order matters: authenticate first, then authorize.
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [TokenService],
})
export class AuthModule {}
