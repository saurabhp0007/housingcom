import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import type { ListingEventType } from '@housingcom/contracts';

/** What a signed-in user did with a listing; the input to personal recommendations. */
@Entity('listing_activities')
@Index(['userId', 'createdAt'])
export class ListingActivity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column('uuid')
  userId: string;

  @Index()
  @Column('uuid')
  listingId: string;

  @Column({ type: 'varchar', length: 12 })
  type: ListingEventType;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
