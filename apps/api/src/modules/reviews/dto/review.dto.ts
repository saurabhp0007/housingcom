import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import type { ReviewInput } from '@housingcom/contracts';

export class ReviewDto implements ReviewInput {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
