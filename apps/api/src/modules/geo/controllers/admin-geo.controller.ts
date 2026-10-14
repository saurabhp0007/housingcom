import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@housingcom/contracts';
import { Roles } from '../../../core/http/decorators/index.js';
import { CreateAreaDto, CreateCityDto, UpdateAreaDto, UpdateCityDto } from '../dto/admin-geo.dto.js';
import { GeoAdminService, type AdminAreaResponse, type AdminCityResponse } from '../services/geo-admin.service.js';

@ApiTags('Admin · Cities & areas')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@Controller('admin')
export class AdminGeoController {
  constructor(private readonly geoAdmin: GeoAdminService) {}

  @Get('cities')
  cities(): Promise<AdminCityResponse[]> {
    return this.geoAdmin.cities();
  }

  @Post('cities')
  createCity(@Body() dto: CreateCityDto): Promise<AdminCityResponse> {
    return this.geoAdmin.createCity(dto);
  }

  @Patch('cities/:id')
  updateCity(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCityDto): Promise<AdminCityResponse> {
    return this.geoAdmin.updateCity(id, dto);
  }

  @Get('cities/:id/areas')
  areas(@Param('id', ParseUUIDPipe) id: string): Promise<AdminAreaResponse[]> {
    return this.geoAdmin.areas(id);
  }

  @Post('cities/:id/areas')
  createArea(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateAreaDto): Promise<AdminAreaResponse> {
    return this.geoAdmin.createArea(id, dto);
  }

  @Patch('areas/:id')
  updateArea(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAreaDto): Promise<AdminAreaResponse> {
    return this.geoAdmin.updateArea(id, dto);
  }
}
