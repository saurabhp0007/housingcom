import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigController } from './controllers/app-config.controller.js';
import { AppPlatformConfig } from './entities/app-platform-config.entity.js';
import { APP_CONFIG_REPOSITORY } from './interfaces/app-config-repository.interface.js';
import { TypeOrmAppConfigRepository } from './repositories/app-config.repository.js';
import { AppConfigService } from './services/app-config.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([AppPlatformConfig])],
  controllers: [AppConfigController],
  providers: [
    AppConfigService,
    { provide: APP_CONFIG_REPOSITORY, useClass: TypeOrmAppConfigRepository },
  ],
})
export class AppConfigModule {}
