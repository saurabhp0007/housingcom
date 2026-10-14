import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Platform, UpdateChannel } from '@housingcom/contracts';

export class ListUpdatesQueryDto {
  @IsOptional()
  @IsIn(Object.values(Platform))
  platform?: Platform;

  @IsOptional()
  @IsIn(Object.values(UpdateChannel))
  channel?: UpdateChannel;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
