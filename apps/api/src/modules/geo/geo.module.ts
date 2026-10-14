import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminGeoController } from './controllers/admin-geo.controller.js';
import { GeoController } from './controllers/geo.controller.js';
import { Area } from './entities/area.entity.js';
import { City } from './entities/city.entity.js';
import { GEO_REPOSITORY } from './interfaces/geo-repository.interface.js';
import { TypeOrmGeoRepository } from './repositories/geo.repository.js';
import { GeoAdminService } from './services/geo-admin.service.js';
import { GeoService } from './services/geo.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([City, Area])],
  controllers: [GeoController, AdminGeoController],
  providers: [GeoService, GeoAdminService, { provide: GEO_REPOSITORY, useClass: TypeOrmGeoRepository }],
  exports: [GeoService],
})
export class GeoModule {}
