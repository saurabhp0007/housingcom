import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRole, UserStatus, type Paginated } from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import { UserAdminEvent, type UserModeratedEvent } from '../../../core/events/domain-events.js';
import type { User } from '../entities/user.entity.js';
import {
  USERS_REPOSITORY,
  type UserCounts,
  type UserSearchFilter,
  type UsersRepository,
} from '../interfaces/users-repository.interface.js';

/** Admin user management: search, block and unblock. */
@Injectable()
export class UsersAdminService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    private readonly events: EventEmitter2,
  ) {}

  search(filter: UserSearchFilter): Promise<Paginated<User>> {
    return this.users.search(filter);
  }

  counts(since: Date): Promise<UserCounts> {
    return this.users.counts(since);
  }

  async setBlocked(adminId: string, userId: string, blocked: boolean): Promise<User> {
    if (adminId === userId)
      throw AppException.badRequest(ErrorCode.CannotModerateSelf, "You can't block yourself");
    const user = await this.users.findById(userId);
    if (!user) throw AppException.notFound('User');
    if (blocked && user.roles.includes(UserRole.Admin)) {
      throw AppException.forbidden(ErrorCode.Forbidden, 'Admins cannot be blocked from the app');
    }

    await this.users.setStatus(userId, blocked ? UserStatus.Blocked : UserStatus.Active);
    // Awaited: when this returns, sessions are revoked and the blocklist is set.
    await this.events.emitAsync(blocked ? UserAdminEvent.Blocked : UserAdminEvent.Unblocked, {
      userId,
      actorId: adminId,
    } satisfies UserModeratedEvent);
    return (await this.users.findById(userId))!;
  }
}
