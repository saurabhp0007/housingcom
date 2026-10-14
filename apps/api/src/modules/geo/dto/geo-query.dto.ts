import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import type { NearbyAreasQuery, ResolveLocationQuery } from '@housingcom/contracts';

export class ResolveLocationQueryDto implements ResolveLocationQuery {
  @Type(() => Number)
  @IsLatitude()
  lat: number;

  @Type(() => Number)
  @IsLongitude()
  lng: number;
}

export class NearbyAreasQueryDto extends ResolveLocationQueryDto implements NearbyAreasQuery {
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(50)
  radiusKm: number = 10;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}

export class CityAreasQueryDto {
  /** Only areas flagged popular (used for quick-pick chips). */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  popular?: boolean;
}
