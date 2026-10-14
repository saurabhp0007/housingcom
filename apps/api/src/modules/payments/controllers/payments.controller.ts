import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import type { Paginated, PaymentResponse } from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser, Public } from '../../../core/http/decorators/index.js';
import { PageQueryDto } from '../../../core/http/dto/page-query.dto.js';
import { VerifyPaymentDto } from '../dto/payments.dto.js';
import { PaymentsService } from '../services/payments.service.js';

@ApiTags('Payments')
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('me/payments')
  @ApiBearerAuth()
  mine(
    @CurrentUser() user: AuthUser,
    @Query() q: PageQueryDto,
  ): Promise<Paginated<PaymentResponse>> {
    return this.payments.mine(user.id, q.page, q.limit);
  }

  /** The app posts checkout's signed result; fulfilment happens before this returns. */
  @Post('me/payments/:id/verify')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  verify(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyPaymentDto,
  ): Promise<PaymentResponse> {
    return this.payments.verify(user.id, id, dto);
  }

  /** Razorpay webhook. Verified with an HMAC of the raw body. */
  @Post('payments/webhooks/razorpay')
  @Public()
  @SkipThrottle()
  @ApiExcludeEndpoint()
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string | undefined,
  ): Promise<{ received: true }> {
    await this.payments.handleWebhook(req.rawBody, signature);
    return { received: true };
  }
}
