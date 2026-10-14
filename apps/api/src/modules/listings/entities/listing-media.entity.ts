import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import type { MediaKind } from '@housingcom/contracts';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { Listing } from './listing.entity.js';

/** A processed photo (webp + thumbnail) or video stored in object storage. */
@Entity('listing_media')
@Index(['listingId', 'position'])
export class ListingMedia extends BaseEntity {
  @Column('uuid')
  listingId: string;

  @ManyToOne(() => Listing, (l) => l.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing?: Relation<Listing>;

  @Column({ type: 'varchar', length: 8 })
  kind: MediaKind;

  @Column({ type: 'varchar', length: 255 })
  storageKey: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  thumbnailKey: string | null;

  @Column({ type: 'integer', nullable: true })
  width: number | null;

  @Column({ type: 'integer', nullable: true })
  height: number | null;

  @Column({ type: 'integer' })
  sizeBytes: number;

  @Column({ type: 'smallint', default: 0 })
  position: number;
}
