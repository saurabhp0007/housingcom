import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants.js';

/** Small JSON cache over Redis. Cache failures degrade to a miss, never to an error. */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      this.logger.warn({ err, key }, 'Cache read failed');
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn({ err, key }, 'Cache write failed');
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      await this.redis.del(...keys);
    } catch (err) {
      this.logger.warn({ err, keys }, 'Cache delete failed');
    }
  }

  /** Deletes every key starting with `prefix` (SCAN, never KEYS, so Redis isn't blocked). */
  async delPrefix(prefix: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [next, keys] = await this.redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 200);
        if (keys.length) await this.redis.del(...keys);
        cursor = next;
      } while (cursor !== '0');
    } catch (err) {
      this.logger.warn({ err, prefix }, 'Cache prefix delete failed');
    }
  }

  /** Read-through helper. */
  async wrap<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await load();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}
