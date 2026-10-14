import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserAdminEvent, type UserModeratedEvent } from '../../../core/events/domain-events.js';
import {
  AUTH_SESSIONS_REPOSITORY,
  type AuthSessionsRepository,
} from '../interfaces/auth-sessions-repository.interface.js';
import { UserBlocklistService } from '../services/user-blocklist.service.js';

@Injectable()
export class UserModerationListener {
  constructor(
    @Inject(AUTH_SESSIONS_REPOSITORY) private readonly sessions: AuthSessionsRepository,
    private readonly blocklist: UserBlocklistService,
  ) {}

  @OnEvent(UserAdminEvent.Blocked)
  async onBlocked({ userId }: UserModeratedEvent): Promise<void> {
    await Promise.all([this.sessions.revokeAllForUser(userId, new Date()), this.blocklist.block(userId)]);
  }

  @OnEvent(UserAdminEvent.Unblocked)
  async onUnblocked({ userId }: UserModeratedEvent): Promise<void> {
    await this.blocklist.unblock(userId);
  }
}
