import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  Amenity,
  FurnishingType,
  GenderPreference,
  ListingEventType,
  ListingSort,
  ListingType,
  SharingType,
  type ListingFilters,
} from '@housingcom/contracts';

/** Accepts `?types=room&types=pg` and `?types=room,pg`. */
const toArray = ({ value }: { value: unknown }) =>
  value === undefined || value === '' ? undefined : (Array.isArray(value) ? value : String(value).split(',')).map(String);
const toBool = ({ value }: { value: unknown }) => (value === undefined ? undefined : value === true || value === 'true');

export class ListingFiltersDto implements ListingFilters {
  @IsOptional() @Transform(toArray) @IsArray() @IsIn(Object.values(ListingType), { each: true })
  types?: ListingType[];

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  minRent?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  maxRent?: number;

  @IsOptional() @Transform(toArray) @IsArray() @IsIn(Object.values(SharingType), { each: true })
  sharing?: SharingType[];

  @IsOptional() @Transform(toArray) @IsArray() @IsIn(Object.values(GenderPreference), { each: true })
  genders?: GenderPreference[];

  @IsOptional() @Transform(toArray) @IsArray() @IsIn(Object.values(FurnishingType), { each: true })
  furnishing?: FurnishingType[];

  @IsOptional() @Transform(toBool) @IsBoolean()
  foodIncluded?: boolean;

  @IsOptional() @Transform(toArray) @IsArray() @ArrayMaxSize(18) @IsIn(Object.values(Amenity), { each: true })
  amenities?: Amenity[];

  /** Available on or before (YYYY-MM-DD). */
  @IsOptional() @IsDateString({ strict: true })
  availableBy?: string;

  /** Keywords over title, address and description. */
  @IsOptional() @IsString() @MaxLength(80)
  q?: string;
}

export class SearchListingsQueryDto extends ListingFiltersDto {
  @IsOptional() @Type(() => Number) @IsLatitude()
  lat?: number;

  @IsOptional() @Type(() => Number) @IsLongitude()
  lng?: number;

  @Type(() => Number) @IsNumber() @Min(0.5) @Max(50)
  radiusKm: number = 10;

  @IsOptional() @IsUUID()
  cityId?: string;

  @IsOptional() @IsUUID()
  areaId?: string;

  @IsIn(Object.values(ListingSort))
  sort: ListingSort = ListingSort.Recommended;

  @Type(() => Number) @IsInt() @Min(1)
  page: number = 1;

  @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limit: number = 20;
}

export class MapQueryDto extends ListingFiltersDto {
  @Type(() => Number) @IsLatitude() minLat: number;
  @Type(() => Number) @IsLongitude() minLng: number;
  @Type(() => Number) @IsLatitude() maxLat: number;
  @Type(() => Number) @IsLongitude() maxLng: number;
}

export class TrackEventDto {
  @IsIn([ListingEventType.Share])
  type: typeof ListingEventType.Share;
}
