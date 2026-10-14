import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { Listing } from '../../listings/entities/listing.entity.js';
import { User } from '../../users/entities/user.entity.js';

/** One review per customer per listing; editing replaces it. */
@Entity('reviews')
@Index(['listingId', 'authorId'], { unique: true })
@Index(['listingId', 'createdAt'])
export class Review extends BaseEntity {
  @Column('uuid')
  listingId: string;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing?: Relation<Listing>;

  @Index()
  @Column('uuid')
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author?: Relation<User>;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  comment: string | null;
}
