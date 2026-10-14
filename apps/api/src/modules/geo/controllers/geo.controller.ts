import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AreaResponse, CityResponse, ResolvedLocationResponse } from '@housingcom/contracts';
import { Public } from '../../../core/http/decorators/index.js';
import {
  CityAreasQueryDto,
  NearbyAreasQueryDto,
  ResolveLocationQueryDto,
} from '../dto/geo-query.dto.js';
import { GeoService } from '../services/geo.service.js';

@ApiTags('Geo')
@Public()
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('cities')
  cities(): Promise<CityResponse[]> {
    return this.geoService.listCities();
  }

  @Get('cities/:cityId/areas')
  areas(
    @Param('cityId', ParseUUIDPipe) cityId: string,
    @Query() query: CityAreasQueryDto,
  ): Promise<AreaResponse[]> {
    return this.geoService.listAreas(cityId, query.popular);
  }

  @Get('areas/nearby')
  nearby(@Query() query: NearbyAreasQueryDto): Promise<AreaResponse[]> {
    return this.geoService.nearbyAreas(query, query.radiusKm, query.limit);
  }

  /** Device location → nearest serviceable area and city. */
  @Get('resolve')
  resolve(@Query() query: ResolveLocationQueryDto): Promise<ResolvedLocationResponse> {
    return this.geoService.resolve(query);
  }
}
