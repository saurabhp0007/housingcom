import 'reflect-metadata';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { appConfig, redisConfig } from './config/configuration.js';
import { RedisIoAdapter } from './core/realtime/redis-io.adapter.js';

async function bootstrap(): Promise<void> {
  // rawBody: payment webhooks are verified against the exact bytes received.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });
  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);

  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.enableCors({ origin: config.corsOrigins, credentials: false });
  app.set('trust proxy', 1);
  app.setGlobalPrefix(config.apiPrefix);
  app.enableVersioning({ type: VersioningType.HEADER, header: 'x-api-version' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validateCustomDecorators: true,
    }),
  );
  app.enableShutdownHooks();

  // Real-time chat: Socket.IO fanned out across instances through Redis.
  const redis = app.get<ConfigType<typeof redisConfig>>(redisConfig.KEY);
  const io = new RedisIoAdapter(
    app,
    redis.url,
    config.corsOrigins.length ? config.corsOrigins : true,
  );
  await io.connect();
  app.useWebSocketAdapter(io);

  if (!config.isProduction) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Housing API').setVersion('1').addBearerAuth().build(),
    );
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(config.port);
}

await bootstrap();
