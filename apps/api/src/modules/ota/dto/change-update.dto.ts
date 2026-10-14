import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { UpdateStatus } from '@housingcom/contracts';

export class ChangeUpdateDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  rolloutPercent?: number;

  /** active ↔ paused; rolled_back is final. */
  @IsOptional()
  @IsIn(Object.values(UpdateStatus))
  status?: UpdateStatus;
}
