import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import type { ContactChannel } from '@housingcom/contracts';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { Listing } from '../../listings/entities/listing.entity.js';
import { User } from '../../users/entities/user.entity.js';

/**
 * One row per (listing, customer) once the customer contacts the owner or asks for a visit.
 * It is the owner's lead inbox and the proof that a customer may review the listing.
 */
@Entity('leads')
@Index(['listingId', 'customerId'], { unique: true })
@Index(['ownerId', 'lastContactAt'])
export class Lead extends BaseEntity {
  @Column('uuid')
  listingId: string;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing?: Relation<Listing>;

  @Index()
  @Column('uuid')
  customerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Relation<User>;

  /** Denormalised from the listing so the owner's inbox is a single index scan. */
  @Column('uuid')
  ownerId: string;

  @Column({ type: 'text', array: true, default: () => `'{}'` })
  channels: ContactChannel[];

  @Column({ type: 'timestamptz' })
  lastContactAt: Date;
}
