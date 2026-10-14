import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { SavedSearch } from './saved-search.entity.js';

/** Remembers which listings were already alerted for a search, so re-publishing never re-alerts. */
@Entity('saved_search_alerts')
export class SavedSearchAlert {
  @PrimaryColumn('uuid')
  savedSearchId: string;

  @PrimaryColumn('uuid')
  listingId: string;

  @ManyToOne(() => SavedSearch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saved_search_id' })
  savedSearch?: Relation<SavedSearch>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
