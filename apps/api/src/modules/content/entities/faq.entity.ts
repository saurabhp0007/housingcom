import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';

@Entity('faqs')
@Index(['isPublished', 'sortOrder'])
export class Faq extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;
}
