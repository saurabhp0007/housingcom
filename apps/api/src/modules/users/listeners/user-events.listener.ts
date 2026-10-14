import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DomainEvent,
  type UserBecameListerEvent,
  type UserRegisteredEvent,
} from '../../../core/events/domain-events.js';

/**
 * Reacts to user lifecycle events. Phase 1 records them; later phases hang welcome
 * notifications and analytics off these same events without touching UsersService.
 */
@Injectable()
export class UserEventsListener {
  private readonly logger = new Logger(UserEventsListener.name);

  @OnEvent(DomainEvent.UserRegistered, { async: true })
  onRegistered(event: UserRegisteredEvent): void {
    this.logger.log({ event: DomainEvent.UserRegistered, ...event }, 'User registered');
  }

  @OnEvent(DomainEvent.UserBecameLister, { async: true })
  onBecameLister(event: UserBecameListerEvent): void {
    this.logger.log(
      { event: DomainEvent.UserBecameLister, ...event },
      'User switched to lister mode',
    );
  }
}
