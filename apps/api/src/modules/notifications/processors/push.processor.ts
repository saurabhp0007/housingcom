import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QueueName } from '../../../core/queue/queue.constants.js';
import { UsersService } from '../../users/services/users.service.js';
import {
  PUSH_PROVIDER,
  type PushMessage,
  type PushProvider,
} from '../interfaces/push-provider.interface.js';
import type { PushJob } from '../services/notifications.service.js';

const AUDIENCE_PAGE = 1000;

/** Delivers pushes off the request path and forgets tokens of uninstalled apps. */
@Processor(QueueName.Push, { concurrency: 5 })
export class PushProcessor extends WorkerHost {
  private readonly logger = new Logger(PushProcessor.name);

  constructor(
    @Inject(PUSH_PROVIDER) private readonly push: PushProvider,
    private readonly users: UsersService,
  ) {
    super();
  }

  async process(job: Job<PushJob>): Promise<void> {
    const data = job.data;
    if (data.kind === 'users') {
      await this.deliver(await this.users.pushTokensForUsers(data.userIds), data.message);
      return;
    }
    let after: string | null = null;
    let total = 0;
    for (;;) {
      const page = await this.users.pushTokensPage({ cityId: data.cityId }, after, AUDIENCE_PAGE);
      total += await this.deliver(
        page.map((t) => t.token),
        data.message,
      );
      if (page.length < AUDIENCE_PAGE) break;
      after = page[page.length - 1]!.deviceId;
    }
    this.logger.log({ cityId: data.cityId, sent: total }, 'Broadcast delivered');
  }

  private async deliver(tokens: string[], message: PushMessage): Promise<number> {
    if (tokens.length === 0) return 0;
    const { sent, invalidTokens } = await this.push.send(tokens, message);
    if (invalidTokens.length) await this.users.clearPushTokens(invalidTokens);
    return sent;
  }
}
