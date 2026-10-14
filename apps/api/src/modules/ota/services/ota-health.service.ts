import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Queue } from 'bullmq';
import { UpdateHealthEvent, UpdateStatus, type OtaHealthReport } from '@housingcom/contracts';
import { otaConfig } from '../../../config/configuration.js';
import { DomainEvent, type OtaUpdateAutoPausedEvent } from '../../../core/events/domain-events.js';
import { QueueName } from '../../../core/queue/queue.constants.js';
import {
  OTA_UPDATES_REPOSITORY,
  type OtaUpdatesRepository,
} from '../interfaces/ota-updates-repository.interface.js';
import { shouldAutoPause } from '../policies/ota-rollout.policy.js';

export const OTA_HEALTH_JOB = 'record';

/**
 * Health pipeline: the app reports launches/crashes per update; the endpoint only enqueues.
 * The worker aggregates counts and pauses an update whose crash rate crosses the threshold,
 * so devices stop receiving it (and devices already on it roll back to the embedded bundle).
 */
@Injectable()
export class OtaHealthService {
  private readonly logger = new Logger(OtaHealthService.name);

  constructor(
    @InjectQueue(QueueName.OtaHealth) private readonly queue: Queue<OtaHealthReport>,
    @Inject(OTA_UPDATES_REPOSITORY) private readonly updates: OtaUpdatesRepository,
    @Inject(otaConfig.KEY) private readonly config: ConfigType<typeof otaConfig>,
    private readonly events: EventEmitter2,
  ) {}

  async report(report: OtaHealthReport): Promise<void> {
    await this.queue.add(OTA_HEALTH_JOB, report, {
      removeOnComplete: 1000,
      removeOnFail: 1000,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }

  /** Called by the queue worker. */
  async apply(report: OtaHealthReport): Promise<void> {
    const crashed = report.event === UpdateHealthEvent.Crashed;
    const update = await this.updates.incrementHealth(
      report.updateId,
      crashed ? 0 : 1,
      crashed ? 1 : 0,
    );
    if (!update || update.status !== UpdateStatus.Active) return;

    if (shouldAutoPause(update, this.config.autoPause)) {
      await this.updates.setStatus(update.id, UpdateStatus.Paused);
      const event: OtaUpdateAutoPausedEvent = {
        updateId: update.id,
        launchCount: update.launchCount,
        crashCount: update.crashCount,
        crashRate: update.crashCount / update.launchCount,
      };
      this.events.emit(DomainEvent.OtaUpdateAutoPaused, event);
      this.logger.warn(event, 'OTA update auto-paused: crash rate over threshold');
    }
  }
}
