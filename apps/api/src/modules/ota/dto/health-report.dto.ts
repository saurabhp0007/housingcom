import { IsIn, IsUUID } from 'class-validator';
import { UpdateHealthEvent, type OtaHealthReport } from '@housingcom/contracts';

export class HealthReportDto implements OtaHealthReport {
  @IsUUID()
  updateId: string;

  @IsIn(Object.values(UpdateHealthEvent))
  event: UpdateHealthEvent;
}
