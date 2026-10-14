import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import type { Platform } from '@housingcom/contracts';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { User } from '../../users/entities/user.entity.js';

/**
 * A refresh-token session per device. Only the SHA-256 of the token is stored;
 * the token rotates on every refresh.
 */
@Entity('auth_sessions')
export class AuthSession extends BaseEntity {
  @Index()
  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<User>;

  @Index({ unique: true })
  @Column({ type: 'char', length: 64 })
  refreshTokenHash: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  deviceId: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  platform: Platform | null;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;
}
