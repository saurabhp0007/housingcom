import { IsOptional, IsString, IsUUID, Length } from 'class-validator';
import type { BroadcastInput } from '@housingcom/contracts';

export class BroadcastDto implements BroadcastInput {
  @IsString()
  @Length(3, 80)
  title: string;

  @IsString()
  @Length(3, 300)
  body: string;

  /** Omit to reach everyone. */
  @IsOptional()
  @IsUUID()
  cityId?: string;
}
