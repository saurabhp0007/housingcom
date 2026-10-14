import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { VerificationStatus } from '@housingcom/contracts';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { User } from '../../users/entities/user.entity.js';

/** A lister's request to be verified. Documents live in private storage, never public URLs. */
@Entity('verification_requests')
@Index(['status', 'createdAt'])
export class VerificationRequest extends BaseEntity {
  @Index()
  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<User>;

  @Column({ type: 'varchar', length: 16, default: VerificationStatus.Pending })
  status: VerificationStatus;

  @Column({ type: 'varchar', length: 255 })
  idDocumentKey: string;

  @Column({ type: 'varchar', length: 255 })
  propertyDocumentKey: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;
}
