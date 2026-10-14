import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

/** Admin announcement to every user or to one city's users. */
@Entity('broadcasts')
export class Broadcast extends BaseEntity {
  @Column({ type: 'varchar', length: 80 })
  title: string;

  @Column({ type: 'varchar', length: 300 })
  body: string;

  @Column({ type: 'uuid', nullable: true })
  cityId: string | null;

  @Column({ type: 'integer', default: 0 })
  recipientCount: number;

  @Column('uuid')
  createdBy: string;
}
