import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import type { OtaHealthReport } from '@housingcom/contracts';
import { QueueName } from '../../../core/queue/queue.constants.js';
import { OtaHealthService } from '../services/ota-health.service.js';

@Processor(QueueName.OtaHealth)
export class OtaHealthProcessor extends WorkerHost {
  constructor(private readonly health: OtaHealthService) {
    super();
  }

  process(job: Job<OtaHealthReport>): Promise<void> {
    return this.health.apply(job.data);
  }
}
