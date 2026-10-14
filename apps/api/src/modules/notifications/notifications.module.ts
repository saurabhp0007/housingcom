import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { notificationsConfig } from '../../config/configuration.js';
import { QueueName } from '../../core/queue/queue.constants.js';
import { ListingsModule } from '../listings/listings.module.js';
import { UsersModule } from '../users/users.module.js';
import { AdminBroadcastsController } from './controllers/admin-broadcasts.controller.js';
import { NotificationsController } from './controllers/notifications.controller.js';
import { Broadcast } from './entities/broadcast.entity.js';
import { Notification } from './entities/notification.entity.js';
import { NOTIFICATIONS_REPOSITORY } from './interfaces/notifications-repository.interface.js';
import { PUSH_PROVIDER } from './interfaces/push-provider.interface.js';
import { NotificationEventsListener } from './listeners/notification-events.listener.js';
import { PushProcessor } from './processors/push.processor.js';
import { ExpoPushProvider } from './providers/expo-push.provider.js';
import { LogPushProvider } from './providers/log-push.provider.js';
import { TypeOrmNotificationsRepository } from './repositories/notifications.repository.js';
import { NotificationsService } from './services/notifications.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Broadcast]),
    BullModule.registerQueue({ name: QueueName.Push }),
    ListingsModule,
    UsersModule,
  ],
  controllers: [NotificationsController, AdminBroadcastsController],
  providers: [
    NotificationsService,
    NotificationEventsListener,
    PushProcessor,
    ExpoPushProvider,
    LogPushProvider,
    {
      provide: PUSH_PROVIDER,
      inject: [notificationsConfig.KEY, ExpoPushProvider, LogPushProvider],
      useFactory: (
        config: ConfigType<typeof notificationsConfig>,
        expo: ExpoPushProvider,
        log: LogPushProvider,
      ) => (config.pushEnabled ? expo : log),
    },
    { provide: NOTIFICATIONS_REPOSITORY, useClass: TypeOrmNotificationsRepository },
  ],
})
export class NotificationsModule {}
