import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { UpdateChannel } from '@housingcom/contracts';

/** Multipart form fields sent with the bundle zip. */
export class PublishUpdateDto {
  @IsIn(Object.values(UpdateChannel))
  channel: UpdateChannel;

  /** Percent of devices that receive the update (staged rollout). */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  rolloutPercent: number = 100;

  /** Critical updates are applied immediately instead of on next cold start. */
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  isCritical: boolean = false;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  publishedBy?: string;
}
