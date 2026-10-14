import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Redis } from 'ioredis';
import { redisConfig } from '../../config/configuration.js';
import { CacheService } from './cache.service.js';
import { parseRedisUrl, REDIS_CLIENT } from './redis.constants.js';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [redisConfig.KEY],
      useFactory: (config: ConfigType<typeof redisConfig>) =>
        new Redis({ ...parseRedisUrl(config.url), maxRetriesPerRequest: 3, lazyConnect: false }),
    },
    CacheService,
  ],
  exports: [REDIS_CLIENT, CacheService],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit();
  }
}
