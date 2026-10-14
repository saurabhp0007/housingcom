import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import type { ListerType } from '@housingcom/contracts';
import { User } from './user.entity.js';

/** Created when a customer switches to lister mode. Verification is granted by admins. */
@Entity('lister_profiles')
export class ListerProfile {
  @PrimaryColumn('uuid')
  userId: string;

  @OneToOne(() => User, (user) => user.listerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<User>;

  @Column({ type: 'varchar', length: 16 })
  type: ListerType;

  @Column({ type: 'varchar', length: 120, nullable: true })
  businessName: string | null;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
