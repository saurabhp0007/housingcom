import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { ListingStatus } from '@housingcom/contracts';

export class MyListingsQueryDto {
  @IsOptional()
  @IsIn(Object.values(ListingStatus))
  status?: ListingStatus;
}

export class ModerationQueueQueryDto {
  @IsIn(Object.values(ListingStatus))
  status: ListingStatus = ListingStatus.PendingApproval;

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

export class RejectDto {
  /** Shown to the lister so they can fix and resubmit. */
  @IsString()
  @Length(5, 500)
  reason: string;
}
