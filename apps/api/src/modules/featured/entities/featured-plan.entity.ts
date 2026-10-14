import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';
import { Area } from '../../geo/entities/area.entity.js';
import { City } from '../../geo/entities/city.entity.js';

/**
 * A price for featuring a listing for N days. Scope: everywhere (no city/area), a city, or
 * one area; the most specific scope that has plans wins for a listing.
 */
@Entity('featured_plans')
@Index(['isActive', 'sortOrder'])
export class FeaturedPlan extends BaseEntity {
  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Column({ type: 'integer' })
  durationDays: number;

  /** Whole rupees. */
  @Column({ type: 'integer' })
  priceInr: number;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  cityId: string | null;

  @ManyToOne(() => City, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'city_id' })
  city?: Relation<City> | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  areaId: string | null;

  @ManyToOne(() => Area, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'area_id' })
  area?: Relation<Area> | null;

  /** Most featured listings at once in one area (null = unlimited). */
  @Column({ type: 'integer', nullable: true })
  maxSlotsPerArea: number | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;
}
