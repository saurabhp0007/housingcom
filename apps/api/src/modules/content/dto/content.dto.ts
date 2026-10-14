import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

import {
  ContentPageSlug,
  type BannerInput,
  type ContentPageInput,
  type FaqInput,
} from '@housingcom/contracts';

export class FaqDto implements FaqInput {
  @IsString()
  @Length(5, 200)
  question: string;

  @IsString()
  @Length(2, 2000)
  answer: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  sortOrder?: number;

  @IsBoolean()
  isPublished: boolean;
}

export class UpdateFaqDto extends PartialType(FaqDto) {}

export class ContentPageDto implements ContentPageInput {
  @IsString()
  @Length(2, 100)
  title: string;

  @IsString()
  @Length(1, 50_000)
  body: string;
}

export class SlugParam {
  @IsIn(Object.values(ContentPageSlug))
  slug: ContentPageSlug;
}

export class BannerDto implements BannerInput {
  @IsString()
  @Length(2, 80)
  title: string;

  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsString()
  @MaxLength(160)
  subtitle?: string | null;

  /** In-app route (/search) or https URL. */
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsString()
  @MaxLength(255)
  @Matches(/^(\/|https:\/\/)/, { message: 'Use an app route like /search or an https:// link' })
  linkUrl?: string | null;

  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsUUID()
  cityId?: string | null;

  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsISO8601()
  startsAt?: string | null;

  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsISO8601()
  endsAt?: string | null;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  sortOrder?: number;
}

export class UpdateBannerDto extends PartialType(BannerDto) {}

export class BannersQueryDto {
  @IsOptional()
  @IsUUID()
  cityId?: string;
}
