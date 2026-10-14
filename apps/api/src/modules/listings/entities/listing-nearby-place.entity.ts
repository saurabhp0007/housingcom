import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import type { NearbyPlaceCategory } from '@housingcom/contracts';
import { Listing } from './listing.entity.js';

/** Nearest metro / bus stop / college / hospital, computed once when a listing goes live or moves. */
@Entity('listing_nearby_places')
@Index(['listingId', 'category'], { unique: true })
export class ListingNearbyPlace {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column('uuid')
  listingId: string;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing?: Relation<Listing>;

  @Column({ type: 'varchar', length: 12 })
  category: NearbyPlaceCategory;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'integer' })
  distanceM: number;
}
