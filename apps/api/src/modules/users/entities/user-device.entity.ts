import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import type { Platform } from '@housingcom/contracts';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { User } from './user.entity.js';

/** One row per installed app per user; holds the push token. */
@Entity('user_devices')
@Index(['userId', 'deviceId'], { unique: true })
export class UserDevice extends BaseEntity {
  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<User>;

  @Column({ type: 'varchar', length: 128 })
  deviceId: string;

  @Column({ type: 'varchar', length: 8 })
  platform: Platform;

  @Column({ type: 'varchar', length: 512, nullable: true })
  pushToken: string | null;

  @Column({ type: 'timestamptz' })
  lastSeenAt: Date;
}
