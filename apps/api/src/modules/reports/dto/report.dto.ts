import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';
import { ReportReason, ReportStatus, type ReportListingInput } from '@housingcom/contracts';

export class ReportListingDto implements ReportListingInput {
  @IsIn(Object.values(ReportReason))
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}

export class ReportQueueQueryDto {
  @IsIn(Object.values(ReportStatus))
  status: ReportStatus = ReportStatus.Open;

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

export class DismissReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class RemoveReportedListingDto {
  /** Shown to the owner. */
  @IsString()
  @Length(5, 500)
  reason: string;
}
