import { Column, Entity, Index, OneToMany, type Point, type Relation } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { Area } from './area.entity.js';

/** A service city. Admins add cities as the business expands. */
@Entity('cities')
export class City extends BaseEntity {
  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Column({ type: 'varchar', length: 80 })
  state: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Index({ spatial: true })
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  center: Point;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Area, (area) => area.city)
  areas?: Relation<Area>[];
}
