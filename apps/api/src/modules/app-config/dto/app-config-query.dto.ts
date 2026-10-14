import { IsIn } from 'class-validator';
import { Platform } from '@housingcom/contracts';

export class AppConfigQueryDto {
  @IsIn(Object.values(Platform))
  platform: Platform;
}
