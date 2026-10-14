import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { PaymentStatus, type PaymentDriver, type PaymentPurpose } from '@housingcom/contracts';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { User } from '../../users/entities/user.entity.js';

/**
 * One gateway order. Generic over what is being bought (`purpose` + `referenceId`), so the
 * payments module never knows about featured listings; fulfilment reacts to PaymentEvent.
 */
@Entity('payments')
@Index(['userId', 'createdAt'])
@Index(['status', 'paidAt'])
export class Payment extends BaseEntity {
  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<User>;

  @Column({ type: 'varchar', length: 32 })
  purpose: PaymentPurpose;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  referenceId: string | null;

  @Column({ type: 'varchar', length: 160 })
  description: string;

  /** Snapshot of what was bought (plan, duration…), so later plan edits don't change history. */
  @Column({ type: 'jsonb', default: () => `'{}'` })
  metadata: Record<string, unknown>;

  /** Integer paise, as gateways expect. */
  @Column({ type: 'integer' })
  amountPaise: number;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency: 'INR';

  @Column({ type: 'varchar', length: 12, default: PaymentStatus.Created })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 12 })
  driver: PaymentDriver;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  gatewayOrderId: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  gatewayPaymentId: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  failureReason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;
}
