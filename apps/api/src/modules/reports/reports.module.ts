import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingsModule } from '../listings/listings.module.js';
import { AdminReportsController } from './controllers/admin-reports.controller.js';
import { ReportsController } from './controllers/reports.controller.js';
import { Report } from './entities/report.entity.js';
import { REPORTS_REPOSITORY } from './interfaces/reports-repository.interface.js';
import { TypeOrmReportsRepository } from './repositories/reports.repository.js';
import { ReportsService } from './services/reports.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Report]), ListingsModule],
  controllers: [ReportsController, AdminReportsController],
  providers: [ReportsService, { provide: REPORTS_REPOSITORY, useClass: TypeOrmReportsRepository }],
  exports: [ReportsService],
})
export class ReportsModule {}
