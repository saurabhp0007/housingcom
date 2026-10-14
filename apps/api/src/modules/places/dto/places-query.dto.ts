import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class PlacesAutocompleteQueryDto {
  @IsString()
  @Length(2, 80)
  q: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number;

  /** One per search session; groups Google autocomplete + details billing. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionToken?: string;
}

export class PlaceDetailsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionToken?: string;
}
