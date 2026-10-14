import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import type { NotificationType } from '@housingcom/contracts';
import { User } from '../../users/entities/user.entity.js';

/** In-app inbox entry. Push is best-effort; the inbox is the record. */
@Entity('notifications')
@Index(['userId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<User>;

  @Column({ type: 'varchar', length: 32 })
  type: NotificationType;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 500 })
  body: string;

  /** In-app route, e.g. /listing/<id>. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  url: string | null;

  @Index({ where: 'read_at IS NULL' })
  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
