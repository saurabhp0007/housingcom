import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Expo, type ExpoPushMessage } from 'expo-server-sdk';
import { notificationsConfig } from '../../../config/configuration.js';
import type {
  PushMessage,
  PushProvider,
  PushResult,
} from '../interfaces/push-provider.interface.js';

/** Android channel created by the app at startup (see app notifications setup). */
const ANDROID_CHANNEL = 'default';

/** Expo Push Service: one API for FCM (Android) and APNs (iOS). */
@Injectable()
export class ExpoPushProvider implements PushProvider {
  private readonly logger = new Logger(ExpoPushProvider.name);
  private readonly expo: Expo;

  constructor(@Inject(notificationsConfig.KEY) config: ConfigType<typeof notificationsConfig>) {
    this.expo = new Expo({ accessToken: config.expoAccessToken });
  }

  async send(tokens: string[], message: PushMessage): Promise<PushResult> {
    const valid: string[] = [];
    const invalidTokens: string[] = [];
    for (const t of tokens) (Expo.isExpoPushToken(t) ? valid : invalidTokens).push(t);
    const messages: ExpoPushMessage[] = valid.map((to) => ({
      to,
      title: message.title,
      body: message.body,
      data: message.data,
      sound: 'default',
      channelId: ANDROID_CHANNEL,
      ...(message.collapseKey
        ? { collapseId: message.collapseKey, threadId: message.collapseKey }
        : {}),
    }));

    let sent = 0;
    // Chunks are ≤100 messages, as the Expo API requires; tickets come back in the same order.
    for (const chunk of this.expo.chunkPushNotifications(messages)) {
      const tickets = await this.expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, i) => {
        if (ticket.status === 'ok') {
          sent++;
        } else if (ticket.details?.error === 'DeviceNotRegistered') {
          invalidTokens.push(chunk[i]!.to as string);
        } else {
          this.logger.warn(
            { error: ticket.details?.error, message: ticket.message },
            'Push failed',
          );
        }
      });
    }
    return { sent, invalidTokens };
  }
}
