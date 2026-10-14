import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { ListerType, type BecomeListerInput } from '@housingcom/contracts';

export class BecomeListerDto implements BecomeListerInput {
  @IsIn(Object.values(ListerType))
  listerType: ListerType;

  /** Agency or PG brand name (dealers and PG operators). */
  @IsOptional()
  @IsString()
  @Length(2, 120)
  businessName?: string;
}
