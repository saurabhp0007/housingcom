import { Check, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import type { Platform, UpdateChannel, UpdateStatus } from '@housingcom/contracts';
import { UpdateStatus as Status } from '@housingcom/contracts';
import type { OtaManifestRecord } from '../domain/ota.types.js';

/**
 * One published JS bundle for one platform + runtime version + channel.
 * `id` is the update ID the expo-updates client stores and reports back.
 */
@Entity('ota_updates')
@Index(['platform', 'runtimeVersion', 'channel', 'status', 'createdAt'])
@Check('"rollout_percent" BETWEEN 0 AND 100')
export class OtaUpdate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 8 })
  platform: Platform;

  /** Native fingerprint; an update only reaches binaries with the same fingerprint. */
  @Column({ type: 'varchar', length: 128 })
  runtimeVersion: string;

  @Column({ type: 'varchar', length: 16 })
  channel: UpdateChannel;

  @Column({ type: 'varchar', length: 16, default: Status.Active })
  status: UpdateStatus;

  @Column({ type: 'smallint', default: 100 })
  rolloutPercent: number;

  /** Critical updates are applied immediately by the app instead of on next launch. */
  @Column({ type: 'boolean', default: false })
  isCritical: boolean;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  gitCommit: string | null;

  @Column({ type: 'jsonb' })
  manifest: OtaManifestRecord;

  /** Public Expo config embedded in the manifest's extra.expoClient. */
  @Column({ type: 'jsonb' })
  expoConfig: Record<string, unknown>;

  @Column({ type: 'integer', default: 0 })
  launchCount: number;

  @Column({ type: 'integer', default: 0 })
  crashCount: number;

  @Column({ type: 'varchar', length: 80, nullable: true })
  publishedBy: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
