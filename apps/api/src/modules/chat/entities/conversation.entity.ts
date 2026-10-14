import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { Listing } from '../../listings/entities/listing.entity.js';
import { User } from '../../users/entities/user.entity.js';

/** One thread per (listing, customer); the owner is the other participant. */
@Entity('conversations')
@Index(['listingId', 'customerId'], { unique: true })
@Index(['customerId', 'lastMessageAt'])
@Index(['ownerId', 'lastMessageAt'])
export class Conversation extends BaseEntity {
  @Column('uuid')
  listingId: string;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing?: Relation<Listing>;

  @Column('uuid')
  customerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Relation<User>;

  @Column('uuid')
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner?: Relation<User>;

  /** Denormalised last message so the inbox needs no per-row lookup. */
  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt: Date | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  lastMessagePreview: string | null;

  @Column({ type: 'uuid', nullable: true })
  lastMessageSenderId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  customerLastReadAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  ownerLastReadAt: Date | null;
}
