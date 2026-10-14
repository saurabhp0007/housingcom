import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { QueueName } from '../../../core/queue/queue.constants.js';
import {
  SavedSearchAlertsService,
  type MatchJob,
} from '../services/saved-search-alerts.service.js';

@Processor(QueueName.SavedSearchAlerts)
export class SavedSearchAlertsProcessor extends WorkerHost {
  constructor(private readonly alerts: SavedSearchAlertsService) {
    super();
  }

  async process(job: Job<MatchJob>): Promise<void> {
    await this.alerts.match(job.data.listingId);
  }
}
