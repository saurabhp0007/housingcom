import { IsNotEmpty, IsString } from 'class-validator';
import type { RefreshTokenInput } from '@housingcom/contracts';

export class RefreshTokenDto implements RefreshTokenInput {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
