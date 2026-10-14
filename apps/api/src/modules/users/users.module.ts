import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './controllers/users.controller.js';
import { ListerProfile } from './entities/lister-profile.entity.js';
import { UserDevice } from './entities/user-device.entity.js';
import { User } from './entities/user.entity.js';
import { USERS_REPOSITORY } from './interfaces/users-repository.interface.js';
import { UserEventsListener } from './listeners/user-events.listener.js';
import { TypeOrmUsersRepository } from './repositories/users.repository.js';
import { UsersService } from './services/users.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, ListerProfile, UserDevice])],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserEventsListener,
    { provide: USERS_REPOSITORY, useClass: TypeOrmUsersRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}
