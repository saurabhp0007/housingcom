import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

/** Home-screen promotional banner, optionally limited to one city and a date window. */
@Entity('banners')
@Index(['isActive', 'sortOrder'])
export class Banner extends BaseEntity {
  @Column({ type: 'varchar', length: 80 })
  title: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  subtitle: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageKey: string | null;

  /** In-app route (/search) or https URL. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  linkUrl: string | null;

  @Column({ type: 'uuid', nullable: true })
  cityId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;
}
