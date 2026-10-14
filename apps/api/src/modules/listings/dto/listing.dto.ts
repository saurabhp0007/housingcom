import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  Amenity,
  FurnishingType,
  GenderPreference,
  ListingType,
  SharingType,
  type CreateListingInput,
  type UpdateListingInput,
} from '@housingcom/contracts';

export class CoordinatesDto {
  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}

/** Every field optional: the editor autosaves drafts step by step. */
export class UpdateListingDto implements UpdateListingInput {
  @IsOptional()
  @IsIn(Object.values(ListingType))
  type?: ListingType;

  @IsOptional()
  @IsString()
  @Length(10, 100)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(30, 2000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(500)
  @Max(1_000_000)
  rent?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5_000_000)
  deposit?: number;

  @IsOptional()
  @IsIn([...Object.values(SharingType), null])
  sharing?: SharingType | null;

  @IsOptional()
  @IsIn(Object.values(GenderPreference))
  gender?: GenderPreference;

  @IsOptional()
  @IsIn(Object.values(FurnishingType))
  furnishing?: FurnishingType;

  @IsOptional()
  @IsBoolean()
  foodIncluded?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsIn(Object.values(Amenity), { each: true })
  amenities?: Amenity[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  houseRules?: string | null;

  /** YYYY-MM-DD */
  @IsOptional()
  @IsDateString({ strict: true })
  availableFrom?: string;

  @IsOptional()
  @IsString()
  @Length(5, 300)
  address?: string;

  /** Map pin. The area and city are resolved from it server-side. */
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  location?: CoordinatesDto;
}

export class CreateListingDto extends UpdateListingDto implements CreateListingInput {
  @IsIn(Object.values(ListingType))
  declare type: ListingType;
}

export class ReorderMediaDto {
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  mediaIds: string[];
}
