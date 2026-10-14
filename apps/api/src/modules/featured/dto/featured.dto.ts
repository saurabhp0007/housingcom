import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  FeatureStatus,
  type FeatureCheckoutInput,
  type FeaturedPlanInput,
  type PinListingInput,
} from '@housingcom/contracts';

export class FeaturedPlanDto implements FeaturedPlanInput {
  @IsString()
  @Length(2, 60)
  name: string;

  @IsInt()
  @Min(1)
  @Max(90)
  durationDays: number;

  @IsInt()
  @Min(1)
  @Max(100_000)
  priceInr: number;

  /** null / omitted = every city. */
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsUUID()
  cityId?: string | null;

  /** Set for an area-specific price. */
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsUUID()
  areaId?: string | null;

  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsInt()
  @Min(1)
  @Max(500)
  maxSlotsPerArea?: number | null;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  sortOrder?: number;
}

export class UpdateFeaturedPlanDto extends PartialType(FeaturedPlanDto) {}

export class FeatureCheckoutDto implements FeatureCheckoutInput {
  @IsUUID()
  planId: string;
}

export class PinListingDto implements PinListingInput {
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays: number;

  /** Pinned listings are placed before the rotation in their area. */
  @IsBoolean()
  pinned: boolean;
}

export class AdminFeaturesQueryDto {
  @IsIn(Object.values(FeatureStatus))
  status: FeatureStatus = FeatureStatus.Active;

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
