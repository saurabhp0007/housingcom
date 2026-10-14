import { Inject, Injectable } from '@nestjs/common';
import { UpdateStatus, type Paginated } from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import type { OtaUpdate } from '../entities/ota-update.entity.js';
import {
  OTA_UPDATES_REPOSITORY,
  type ListOtaUpdatesFilter,
  type OtaUpdatesRepository,
} from '../interfaces/ota-updates-repository.interface.js';

export interface ChangeUpdateInput {
  rolloutPercent?: number;
  status?: UpdateStatus;
}

/** Console operations: list, staged rollout, pause/resume and rollback. */
@Injectable()
export class OtaAdminService {
  constructor(@Inject(OTA_UPDATES_REPOSITORY) private readonly updates: OtaUpdatesRepository) {}

  list(filter: ListOtaUpdatesFilter): Promise<Paginated<OtaUpdate>> {
    return this.updates.list(filter);
  }

  async change(id: string, input: ChangeUpdateInput): Promise<OtaUpdate> {
    const update = await this.updates.findById(id);
    if (!update) throw AppException.notFound('Update');

    if (
      update.status === UpdateStatus.RolledBack &&
      input.status &&
      input.status !== UpdateStatus.RolledBack
    ) {
      throw AppException.badRequest(
        ErrorCode.OtaInvalidRequest,
        'A rolled-back update cannot be re-activated. Publish a new update instead.',
      );
    }

    if (input.rolloutPercent !== undefined) await this.updates.setRollout(id, input.rolloutPercent);
    if (input.status) await this.updates.setStatus(id, input.status);

    return (await this.updates.findById(id))!;
  }
}
