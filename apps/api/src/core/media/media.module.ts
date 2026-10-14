import { Global, Module } from '@nestjs/common';
import { FilesController } from './files.controller.js';
import { ImageProcessingService } from './image-processing.service.js';
import { PublicUrlService } from './public-url.service.js';

@Global()
@Module({
  controllers: [FilesController],
  providers: [ImageProcessingService, PublicUrlService],
  exports: [ImageProcessingService, PublicUrlService],
})
export class MediaModule {}
