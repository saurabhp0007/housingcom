import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { QueueName } from '../../../core/queue/queue.constants.js';
import {
  ListingFeaturesService,
  type LifecycleJobData,
} from '../services/listing-features.service.js';

/** Expiry reminders and period ends, scheduled as delayed jobs at activation. */
@Processor(QueueName.FeaturedLifecycle)
export class FeaturedLifecycleProcessor extends WorkerHost {
  constructor(private readonly features: ListingFeaturesService) {
    super();
  }

  process(job: Job<LifecycleJobData>): Promise<void> {
    return this.features.runLifecycleJob(job.name, job.data);
  }
}
