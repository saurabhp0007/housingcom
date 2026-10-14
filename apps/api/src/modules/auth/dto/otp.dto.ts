import { Type } from 'class-transformer';
import { IsOptional, Matches, ValidateNested } from 'class-validator';
import { OTP_LENGTH, type SendOtpInput, type VerifyOtpInput } from '@housingcom/contracts';
import { RegisterDeviceDto } from '../../users/dto/register-device.dto.js';

const PHONE = /^\+91[6-9]\d{9}$/;

export class SendOtpDto implements SendOtpInput {
  @Matches(PHONE, { message: 'Enter a valid Indian mobile number' })
  phone: string;
}

export class VerifyOtpDto implements VerifyOtpInput {
  @Matches(PHONE, { message: 'Enter a valid Indian mobile number' })
  phone: string;

  @Matches(new RegExp(`^\\d{${OTP_LENGTH}}$`))
  code: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterDeviceDto)
  device?: RegisterDeviceDto;
}
