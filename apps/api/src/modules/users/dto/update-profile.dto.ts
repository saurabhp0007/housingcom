import { IsEmail, IsOptional, IsString, IsUrl, IsUUID, Length, MaxLength } from 'class-validator';
import type { UpdateProfileInput } from '@housingcom/contracts';

export class UpdateProfileDto implements UpdateProfileInput {
  /** Display name shown to owners and in reviews. */
  @IsOptional()
  @IsString()
  @Length(2, 80)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(512)
  avatarUrl?: string;

  /** Set by the app when the user picks a city. */
  @IsOptional()
  @IsUUID()
  preferredCityId?: string;
}
