import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, type OnGatewayConnection } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { UserBlocklistService } from '../../auth/services/user-blocklist.service.js';
import { TokenService } from '../../auth/services/token.service.js';

export const userRoom = (userId: string) => `user:${userId}`;

/**
 * Real-time delivery only: clients connect with `auth: { token }` (the access token) and
 * receive events for their own room. Sending stays on REST so it is validated, throttled
 * and retryable like every other write.
 */
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  private readonly server!: Server;

  constructor(
    private readonly tokens: TokenService,
    private readonly blocklist: UserBlocklistService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = (client.handshake.auth as { token?: unknown } | undefined)?.token;
      if (typeof token !== 'string') throw new Error('missing token');
      const { sub } = await this.tokens.verifyAccessToken(token);
      if (await this.blocklist.isBlocked(sub)) throw new Error('blocked');
      client.data.userId = sub;
      await client.join(userRoom(sub));
    } catch (err) {
      // The app refreshes its token and reconnects on connect_error.
      client.emit('unauthorized');
      client.disconnect(true);
      this.logger.debug({ err: (err as Error).message }, 'Chat socket rejected');
    }
  }

  emitTo(userIds: string[], event: string, payload: unknown): void {
    this.server.to(userIds.map(userRoom)).emit(event, payload);
  }
}
