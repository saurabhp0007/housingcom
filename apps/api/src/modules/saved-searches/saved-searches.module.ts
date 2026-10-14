import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueName } from '../../core/queue/queue.constants.js';
import { ListingsModule } from '../listings/listings.module.js';
import { SavedSearchesController } from './controllers/saved-searches.controller.js';
import { SavedSearchAlert } from './entities/saved-search-alert.entity.js';
import { SavedSearch } from './entities/saved-search.entity.js';
import { SAVED_SEARCHES_REPOSITORY } from './interfaces/saved-searches-repository.interface.js';
import { SavedSearchListener } from './listeners/saved-search.listener.js';
import { SavedSearchAlertsProcessor } from './processors/saved-search-alerts.processor.js';
import { TypeOrmSavedSearchesRepository } from './repositories/saved-searches.repository.js';
import { SavedSearchAlertsService } from './services/saved-search-alerts.service.js';
import { SavedSearchesService } from './services/saved-searches.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavedSearch, SavedSearchAlert]),
    BullModule.registerQueue({ name: QueueName.SavedSearchAlerts }),
    ListingsModule,
  ],
  controllers: [SavedSearchesController],
  providers: [
    SavedSearchesService,
    SavedSearchAlertsService,
    SavedSearchAlertsProcessor,
    SavedSearchListener,
    { provide: SAVED_SEARCHES_REPOSITORY, useClass: TypeOrmSavedSearchesRepository },
  ],
})
export class SavedSearchesModule {}
