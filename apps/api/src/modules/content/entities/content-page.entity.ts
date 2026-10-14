import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { ContentPageSlug } from '@housingcom/contracts';

/** Terms, privacy policy, about: edited by admins in the app. */
@Entity('content_pages')
export class ContentPage {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  slug: ContentPageSlug;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
