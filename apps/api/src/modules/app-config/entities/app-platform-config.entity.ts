import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { Platform } from '@housingcom/contracts';

/**
 * Remote config per platform. Lets ops force a store update, flip feature flags or change
 * support details without shipping any update at all.
 */
@Entity('app_platform_configs')
export class AppPlatformConfig {
  @PrimaryColumn({ type: 'varchar', length: 8 })
  platform: Platform;

  @Column({ type: 'varchar', length: 20 })
  minSupportedVersion: string;

  @Column({ type: 'varchar', length: 20 })
  latestVersion: string;

  @Column({ type: 'varchar', length: 512 })
  storeUrl: string;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  featureFlags: Record<string, boolean>;

  @Column({ type: 'varchar', length: 20, nullable: true })
  supportPhone: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
