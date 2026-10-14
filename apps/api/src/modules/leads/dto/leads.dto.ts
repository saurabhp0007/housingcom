import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  ContactChannel,
  VisitSlot,
  VisitStatus,
  type ContactOwnerInput,
  type RequestVisitInput,
  type RespondVisitInput,
} from '@housingcom/contracts';

export class ContactOwnerDto implements ContactOwnerInput {
  @IsIn(Object.values(ContactChannel))
  channel: ContactChannel;
}

export class RequestVisitDto implements RequestVisitInput {
  /** YYYY-MM-DD */
  @IsDateString({ strict: true })
  date: string;

  @IsIn(Object.values(VisitSlot))
  slot: VisitSlot;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class RespondVisitDto implements RespondVisitInput {
  @IsIn([VisitStatus.Confirmed, VisitStatus.Declined])
  status: 'confirmed' | 'declined';

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
