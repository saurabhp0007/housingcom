import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { otaConfig } from '../../config/configuration.js';
import { QueueName } from '../../core/queue/queue.constants.js';
import { OtaAdminController } from './controllers/ota-admin.controller.js';
import { OtaClientController } from './controllers/ota-client.controller.js';
import { OtaUpdate } from './entities/ota-update.entity.js';
import { OtaAdminGuard } from './guards/ota-admin.guard.js';
import { OTA_UPDATES_REPOSITORY } from './interfaces/ota-updates-repository.interface.js';
import { OtaHealthProcessor } from './processors/ota-health.processor.js';
import { TypeOrmOtaUpdatesRepository } from './repositories/ota-updates.repository.js';
import { OtaAdminService } from './services/ota-admin.service.js';
import { OtaAssetsService } from './services/ota-assets.service.js';
import { OtaBundleParserService } from './services/ota-bundle-parser.service.js';
import { OtaHealthService } from './services/ota-health.service.js';
import { OtaManifestService } from './services/ota-manifest.service.js';
import { OtaPublishService } from './services/ota-publish.service.js';
import { OtaSigningService } from './services/ota-signing.service.js';

/** Self-hosted Expo Updates server: publish, serve, stage, monitor and roll back OTA updates. */
@Module({
  imports: [
    TypeOrmModule.forFeature([OtaUpdate]),
    BullModule.registerQueue({ name: QueueName.OtaHealth }),
    MulterModule.registerAsync({
      inject: [otaConfig.KEY],
      useFactory: (config: ConfigType<typeof otaConfig>) => ({
        limits: { fileSize: config.maxUploadBytes, files: 1 },
      }),
    }),
  ],
  controllers: [OtaClientController, OtaAdminController],
  providers: [
    { provide: OTA_UPDATES_REPOSITORY, useClass: TypeOrmOtaUpdatesRepository },
    OtaAdminGuard,
    OtaBundleParserService,
    OtaPublishService,
    OtaManifestService,
    OtaAssetsService,
    OtaAdminService,
    OtaSigningService,
    OtaHealthService,
    OtaHealthProcessor,
  ],
})
export class OtaModule {}
