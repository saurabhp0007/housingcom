import { Column, Entity, Index, JoinColumn, ManyToOne, type Point, type Relation } from 'typeorm';
import type { ListingFilters } from '@housingcom/contracts';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { User } from '../../users/entities/user.entity.js';

/** A search the user wants to come back to, optionally alerting on new matching listings. */
@Entity('saved_searches')
export class SavedSearch extends BaseEntity {
  @Index()
  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<User>;

  @Column({ type: 'varchar', length: 80 })
  label: string;

  /** Indexed so a new listing finds the searches covering it with one GiST lookup. */
  @Index({ spatial: true })
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  location: Point;

  @Column({ type: 'real' })
  radiusKm: number;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  filters: ListingFilters;

  @Column({ type: 'boolean', default: true })
  alertsEnabled: boolean;
}
