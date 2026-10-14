import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import type { SendMessageInput } from '@housingcom/contracts';

export class SendMessageDto implements SendMessageInput {
  @IsString()
  @Length(1, 2000)
  body: string;
}

export class MessagesQueryDto {
  /** Message id to page backwards from (older messages). */
  @IsOptional()
  @IsUUID()
  before?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 30;
}
