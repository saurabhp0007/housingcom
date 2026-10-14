import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthSessionResponse, AuthTokensResponse } from '@housingcom/contracts';
import { Public } from '../../../core/http/decorators/index.js';
import { FirebaseLoginDto } from '../dto/firebase-login.dto.js';
import { RefreshTokenDto } from '../dto/refresh-token.dto.js';
import { AuthService } from '../services/auth.service.js';

@ApiTags('Auth')
@Public()
@Throttle({ default: { limit: 10, ttl: 60_000 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('firebase')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: FirebaseLoginDto): Promise<AuthSessionResponse> {
    return this.authService.loginWithFirebase(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensResponse> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() dto: RefreshTokenDto): Promise<void> {
    return this.authService.logout(dto.refreshToken);
  }
}
