import { Injectable, Logger } from '@nestjs/common';
import type {
  PushMessage,
  PushProvider,
  PushResult,
} from '../interfaces/push-provider.interface.js';

/** Used when PUSH_ENABLED=false (local dev, tests): logs instead of calling Expo. */
@Injectable()
export class LogPushProvider implements PushProvider {
  private readonly logger = new Logger(LogPushProvider.name);

  async send(tokens: string[], message: PushMessage): Promise<PushResult> {
    this.logger.debug({ devices: tokens.length, title: message.title }, 'Push (disabled)');
    return { sent: 0, invalidTokens: [] };
  }
}
