import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import type { Server, ServerOptions } from 'socket.io';
import { parseRedisUrl } from '../redis/redis.constants.js';

/**
 * Socket.IO over Redis pub/sub so any API instance can emit to a user connected to another one.
 * Horizontal scaling needs nothing else: rooms are per user (`user:<id>`).
 */
export class RedisIoAdapter extends IoAdapter {
  private adapter?: ReturnType<typeof createAdapter>;
  private clients: Redis[] = [];

  constructor(
    app: INestApplicationContext,
    private readonly redisUrl: string,
    private readonly corsOrigins: string[] | boolean,
  ) {
    super(app);
  }

  async connect(): Promise<void> {
    const pub = new Redis({ ...parseRedisUrl(this.redisUrl), lazyConnect: true });
    const sub = pub.duplicate();
    await Promise.all([pub.connect(), sub.connect()]);
    this.clients = [pub, sub];
    this.adapter = createAdapter(pub, sub);
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: this.corsOrigins },
      // Mobile clients use websocket only; skip the long-polling upgrade dance.
      transports: ['websocket'],
    } as ServerOptions) as Server;
    if (this.adapter) server.adapter(this.adapter);
    return server;
  }

  override async close(server: Server): Promise<void> {
    await super.close(server);
    await Promise.all(this.clients.map((c) => c.quit().catch(() => undefined)));
  }
}
