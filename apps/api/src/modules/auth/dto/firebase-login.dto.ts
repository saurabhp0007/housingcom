import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import type { FirebaseLoginInput } from '@housingcom/contracts';
import { RegisterDeviceDto } from '../../users/dto/register-device.dto.js';

export class FirebaseLoginDto implements FirebaseLoginInput {
  /** ID token from Firebase Auth on the device after OTP / Google / Apple sign-in. */
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterDeviceDto)
  device?: RegisterDeviceDto;
}
