import { Column, Entity, Index, JoinColumn, ManyToOne, type Point, type Relation } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { City } from './city.entity.js';

/** A locality inside a city (e.g. Koramangala). Listings and search are anchored to areas. */
@Entity('areas')
@Index(['cityId', 'slug'], { unique: true })
export class Area extends BaseEntity {
  @Index()
  @Column('uuid')
  cityId: string;

  @ManyToOne(() => City, (city) => city.areas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'city_id' })
  city?: Relation<City>;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 120 })
  slug: string;

  @Index({ spatial: true })
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  center: Point;

  @Column({ type: 'boolean', default: false })
  isPopular: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
