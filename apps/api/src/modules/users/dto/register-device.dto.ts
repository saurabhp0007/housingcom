import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { Platform } from '@housingcom/contracts';

export class RegisterDeviceDto {
  @IsString()
  @Length(1, 128)
  id: string;

  @IsIn(Object.values(Platform))
  platform: Platform;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  pushToken?: string;
}
