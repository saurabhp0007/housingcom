import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { FeatureStatus, type FeatureSource } from '@housingcom/contracts';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { Listing } from '../../listings/entities/listing.entity.js';

/**
 * A listing's featured period. Renewing extends the open period (same row, so performance
 * keeps accumulating); a new row starts only after the previous one ended or was removed.
 */
@Entity('listing_features')
// At most one open (active or paused) period per listing.
@Index(['listingId'], { unique: true, where: `status IN ('active', 'paused')` })
@Index(['status', 'endsAt'])
@Index(['areaId', 'status'])
@Index(['ownerId', 'createdAt'])
export class ListingFeature extends BaseEntity {
  @Column('uuid')
  listingId: string;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing?: Relation<Listing>;

  @Column('uuid')
  ownerId: string;

  /** Denormalised for per-area slot counting. */
  @Column({ type: 'uuid', nullable: true })
  areaId: string | null;

  @Column({ type: 'varchar', length: 12, default: FeatureStatus.Active })
  status: FeatureStatus;

  @Column({ type: 'varchar', length: 12 })
  source: FeatureSource;

  @Column({ type: 'boolean', default: false })
  pinned: boolean;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz' })
  endsAt: Date;

  /** Set while paused; resuming adds the paused time back. */
  @Column({ type: 'timestamptz', nullable: true })
  pausedAt: Date | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  planName: string | null;

  @Column({ type: 'integer', default: 0 })
  impressions: number;

  @Column({ type: 'integer', default: 0 })
  views: number;

  @Column({ type: 'integer', default: 0 })
  leads: number;
}
