import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Listing } from '../../listings/entities/listing.entity.js';
import { User } from '../../users/entities/user.entity.js';

/** A customer's saved listing. Composite key: saving twice is a no-op. */
@Entity('favorites')
@Index(['userId', 'createdAt'])
export class Favorite {
  @PrimaryColumn('uuid')
  userId: string;

  @PrimaryColumn('uuid')
  @Index()
  listingId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<User>;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing?: Relation<Listing>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
