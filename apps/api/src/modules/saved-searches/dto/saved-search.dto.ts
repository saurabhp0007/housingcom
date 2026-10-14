import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import type { SavedSearchInput } from '@housingcom/contracts';
import { ListingFiltersDto } from '../../listings/dto/search-query.dto.js';

export class SavedSearchDto implements SavedSearchInput {
  @IsString()
  @Length(2, 80)
  label: string;

  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;

  @IsNumber()
  @Min(0.5)
  @Max(50)
  radiusKm: number;

  @ValidateNested()
  @Type(() => ListingFiltersDto)
  filters: ListingFiltersDto;

  @IsBoolean()
  alertsEnabled: boolean;
}
