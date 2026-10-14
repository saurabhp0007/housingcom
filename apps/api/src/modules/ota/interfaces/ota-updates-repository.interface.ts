import type { Paginated, Platform, UpdateChannel, UpdateStatus } from '@housingcom/contracts';
import type { OtaUpdate } from '../entities/ota-update.entity.js';

export const OTA_UPDATES_REPOSITORY = Symbol('OTA_UPDATES_REPOSITORY');

export interface ListOtaUpdatesFilter {
  platform?: Platform;
  channel?: UpdateChannel;
  page: number;
  limit: number;
}

export type CreateOtaUpdateData = Pick<
  OtaUpdate,
  | 'platform'
  | 'runtimeVersion'
  | 'channel'
  | 'rolloutPercent'
  | 'isCritical'
  | 'message'
  | 'gitCommit'
  | 'manifest'
  | 'expoConfig'
  | 'publishedBy'
>;

export interface OtaUpdatesRepository {
  createMany(data: CreateOtaUpdateData[]): Promise<OtaUpdate[]>;
  findById(id: string): Promise<OtaUpdate | null>;
  /** Active updates for a client's platform/runtime/channel, newest first. */
  findActive(
    platform: Platform,
    runtimeVersion: string,
    channel: UpdateChannel,
    limit: number,
  ): Promise<OtaUpdate[]>;
  list(filter: ListOtaUpdatesFilter): Promise<Paginated<OtaUpdate>>;
  setStatus(id: string, status: UpdateStatus): Promise<void>;
  setRollout(id: string, rolloutPercent: number): Promise<void>;
  /** Atomic increment; returns the updated counters. */
  incrementHealth(id: string, launches: number, crashes: number): Promise<OtaUpdate | null>;
}
