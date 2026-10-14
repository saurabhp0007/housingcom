import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { ReportStatus, type ReportReason } from '@housingcom/contracts';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { Listing } from '../../listings/entities/listing.entity.js';
import { User } from '../../users/entities/user.entity.js';

/** A user's flag on a listing; admins dismiss it or take the listing down. */
@Entity('reports')
@Index(['status', 'createdAt'])
@Index(['listingId', 'status'])
export class Report extends BaseEntity {
  @Column('uuid')
  listingId: string;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing?: Relation<Listing>;

  @Index()
  @Column('uuid')
  reporterId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter?: Relation<User>;

  @Column({ type: 'varchar', length: 16 })
  reason: ReportReason;

  @Column({ type: 'varchar', length: 500, nullable: true })
  details: string | null;

  @Column({ type: 'varchar', length: 12, default: ReportStatus.Open })
  status: ReportStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  resolutionNote: string | null;

  @Column({ type: 'uuid', nullable: true })
  resolvedBy: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;
}
