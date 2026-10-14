import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { PaymentStatus, type VerifyPaymentInput } from '@housingcom/contracts';

export class VerifyPaymentDto implements VerifyPaymentInput {
  @IsString()
  @Length(1, 64)
  gatewayOrderId: string;

  @IsString()
  @Length(1, 64)
  gatewayPaymentId: string;

  @IsString()
  @Length(1, 256)
  signature: string;
}

export class AdminPaymentsQueryDto {
  @IsOptional()
  @IsIn(Object.values(PaymentStatus))
  status?: PaymentStatus;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}
