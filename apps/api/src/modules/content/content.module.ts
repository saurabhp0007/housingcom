import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminContentController } from './controllers/admin-content.controller.js';
import { ContentController } from './controllers/content.controller.js';
import { Banner } from './entities/banner.entity.js';
import { ContentPage } from './entities/content-page.entity.js';
import { Faq } from './entities/faq.entity.js';
import { CONTENT_REPOSITORY } from './interfaces/content-repository.interface.js';
import { TypeOrmContentRepository } from './repositories/content.repository.js';
import { ContentService } from './services/content.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Faq, ContentPage, Banner]),
    MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024, files: 1 } }),
  ],
  controllers: [ContentController, AdminContentController],
  providers: [ContentService, { provide: CONTENT_REPOSITORY, useClass: TypeOrmContentRepository }],
})
export class ContentModule {}
