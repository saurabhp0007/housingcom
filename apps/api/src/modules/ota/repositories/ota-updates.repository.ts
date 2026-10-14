import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UpdateStatus,
  type Paginated,
  type Platform,
  type UpdateChannel,
} from '@housingcom/contracts';
import { buildPaginationMeta } from '../../../core/utils/pagination.util.js';
import { OtaUpdate } from '../entities/ota-update.entity.js';
import type {
  CreateOtaUpdateData,
  ListOtaUpdatesFilter,
  OtaUpdatesRepository,
} from '../interfaces/ota-updates-repository.interface.js';

@Injectable()
export class TypeOrmOtaUpdatesRepository implements OtaUpdatesRepository {
  constructor(@InjectRepository(OtaUpdate) private readonly updates: Repository<OtaUpdate>) {}

  createMany(data: CreateOtaUpdateData[]): Promise<OtaUpdate[]> {
    return this.updates.manager.transaction((manager) =>
      manager.save(data.map((d) => manager.create(OtaUpdate, d))),
    );
  }

  findById(id: string): Promise<OtaUpdate | null> {
    return this.updates.findOneBy({ id });
  }

  findActive(
    platform: Platform,
    runtimeVersion: string,
    channel: UpdateChannel,
    limit: number,
  ): Promise<OtaUpdate[]> {
    return this.updates.find({
      where: { platform, runtimeVersion, channel, status: UpdateStatus.Active },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async list({
    platform,
    channel,
    page,
    limit,
  }: ListOtaUpdatesFilter): Promise<Paginated<OtaUpdate>> {
    const [items, total] = await this.updates.findAndCount({
      where: { ...(platform ? { platform } : {}), ...(channel ? { channel } : {}) },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async setStatus(id: string, status: UpdateStatus): Promise<void> {
    await this.updates.update({ id }, { status });
  }

  async setRollout(id: string, rolloutPercent: number): Promise<void> {
    await this.updates.update({ id }, { rolloutPercent });
  }

  async incrementHealth(id: string, launches: number, crashes: number): Promise<OtaUpdate | null> {
    const result = await this.updates
      .createQueryBuilder()
      .update(OtaUpdate)
      .set({
        launchCount: () => `launch_count + ${Math.trunc(launches)}`,
        crashCount: () => `crash_count + ${Math.trunc(crashes)}`,
      })
      .where('id = :id', { id })
      .returning('*')
      .execute();
    if (!result.affected) return null;
    return this.findById(id);
  }
}
