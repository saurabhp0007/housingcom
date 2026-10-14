import { IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { Platform, UpdateChannel } from '@housingcom/contracts';

/** Headers sent by the expo-updates client (see the decorator that extracts them). */
export class OtaClientHeadersDto {
  @IsIn(Object.values(Platform))
  platform: Platform;

  @IsString()
  @Length(1, 128)
  runtimeVersion: string;

  /** Set by the app via updates.requestHeaders["expo-channel-name"]. */
  @IsIn(Object.values(UpdateChannel))
  channel: UpdateChannel = UpdateChannel.Production;

  /** Stable per-install ID (EAS-Client-ID); used for staged-rollout bucketing. */
  @IsOptional()
  @IsString()
  @Length(1, 128)
  clientId?: string;

  @IsOptional()
  @IsUUID()
  currentUpdateId?: string;

  @IsOptional()
  @IsUUID()
  embeddedUpdateId?: string;

  @IsOptional()
  @IsString()
  recentFailedUpdateIds?: string;

  @IsOptional()
  @IsString()
  expectSignature?: string;
}
