import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorService,
  TypeOrmHealthIndicator,
  type HealthCheckResult,
} from '@nestjs/terminus';
import type { Redis } from 'ioredis';
import { Public, RawResponse } from '../../core/http/decorators/index.js';
import { REDIS_CLIENT } from '../../core/redis/redis.constants.js';

@ApiTags('Health')
@Public()
@RawResponse()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly indicators: HealthIndicatorService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /** Liveness: the process is up. */
  @Get('live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  /** Readiness: dependencies reachable. */
  @Get('ready')
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 1500 }),
      async () => {
        const indicator = this.indicators.check('redis');
        try {
          await this.redis.ping();
          return indicator.up();
        } catch (err) {
          return indicator.down({ message: (err as Error).message });
        }
      },
    ]);
  }
}
