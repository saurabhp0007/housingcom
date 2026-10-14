import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { RecommendationWeights } from '@housingcom/contracts';

/** Single-row table of ranking weights, tuned by admins (PRD §5 "Recommendation settings"). */
@Entity('recommendation_settings')
export class RecommendationSettings {
  @PrimaryColumn({ type: 'smallint', default: 1 })
  id: number;

  @Column({ type: 'jsonb' })
  weights: RecommendationWeights;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
