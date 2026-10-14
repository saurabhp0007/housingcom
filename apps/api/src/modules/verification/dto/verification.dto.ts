import { Type } from 'class-transformer';
import { IsIn, IsInt, Max, Min } from 'class-validator';
import { VerificationStatus } from '@housingcom/contracts';

export class VerificationQueueQueryDto {
  @IsIn(Object.values(VerificationStatus))
  status: VerificationStatus = VerificationStatus.Pending;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}
