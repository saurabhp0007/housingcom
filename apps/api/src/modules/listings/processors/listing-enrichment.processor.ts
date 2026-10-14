import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { QueueName } from '../../../core/queue/queue.constants.js';
import {
  ListingEnrichmentService,
  type NearbyJob,
} from '../services/listing-enrichment.service.js';

@Processor(QueueName.ListingEnrichment)
export class ListingEnrichmentProcessor extends WorkerHost {
  constructor(private readonly enrichment: ListingEnrichmentService) {
    super();
  }

  process(job: Job<NearbyJob>): Promise<void> {
    return this.enrichment.computeNearby(job.data.listingId);
  }
}
