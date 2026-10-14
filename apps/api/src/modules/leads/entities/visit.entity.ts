import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { VisitStatus, type VisitSlot } from '@housingcom/contracts';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { Lead } from './lead.entity.js';

/** A customer's request to see the place on a date and time slot. */
@Entity('visits')
@Index(['customerId', 'date'])
@Index(['ownerId', 'status', 'date'])
export class Visit extends BaseEntity {
  @Index()
  @Column('uuid')
  leadId: string;

  @ManyToOne(() => Lead, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead?: Relation<Lead>;

  @Column('uuid')
  listingId: string;

  @Column('uuid')
  customerId: string;

  @Column('uuid')
  ownerId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 12 })
  slot: VisitSlot;

  @Column({ type: 'varchar', length: 300, nullable: true })
  note: string | null;

  @Column({ type: 'varchar', length: 12, default: VisitStatus.Requested })
  status: VisitStatus;

  @Column({ type: 'varchar', length: 300, nullable: true })
  ownerNote: string | null;
}
