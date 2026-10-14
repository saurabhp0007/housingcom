import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, type ConfigType } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { allConfigs, appConfig, databaseConfig, redisConfig } from './config/configuration.js';
import { buildDataSourceOptions } from './core/database/data-source.options.js';
import { AllExceptionsFilter } from './core/http/filters/all-exceptions.filter.js';
import { ResponseInterceptor } from './core/http/interceptors/response.interceptor.js';
import { parseRedisUrl } from './core/redis/redis.constants.js';
import { RedisModule } from './core/redis/redis.module.js';
import { StorageModule } from './core/storage/storage.module.js';
import { AppConfigModule } from './modules/app-config/app-config.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { GeoModule } from './modules/geo/geo.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { OtaModule } from './modules/ota/ota.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    // ── Infrastructure ──────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true, cache: true, load: allConfigs }),
    LoggerModule.forRootAsync({
      inject: [appConfig.KEY],
      useFactory: (app: ConfigType<typeof appConfig>) => ({
        pinoHttp: {
          level: app.isProduction ? 'info' : 'debug',
          genReqId: (req) => (req.headers['x-request-id'] as string | undefined) ?? randomUUID(),
          redact: ['req.headers.authorization', 'req.headers.cookie'],
          autoLogging: { ignore: (req) => req.url?.includes('/health/') ?? false },
          transport: app.isProduction
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (db: ConfigType<typeof databaseConfig>) => ({
        ...buildDataSourceOptions(db),
        entities: [],
        autoLoadEntities: true,
      }),
    }),
    BullModule.forRootAsync({
      inject: [redisConfig.KEY],
      useFactory: (redis: ConfigType<typeof redisConfig>) => ({
        connection: parseRedisUrl(redis.url),
      }),
    }),
    EventEmitterModule.forRoot({ wildcard: false, ignoreErrors: false }),
    ThrottlerModule.forRootAsync({
      inject: [appConfig.KEY],
      useFactory: (app: ConfigType<typeof appConfig>) => [
        { name: 'default', ttl: app.throttle.ttlMs, limit: app.throttle.limit },
      ],
    }),
    RedisModule,
    StorageModule,

    // ── Features ────────────────────────────────────────────────
    HealthModule,
    UsersModule,
    AuthModule,
    GeoModule,
    AppConfigModule,
    OtaModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
