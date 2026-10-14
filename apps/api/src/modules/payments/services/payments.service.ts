import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  CheckoutResponse,
  Paginated,
  PaymentPurpose,
  PaymentResponse,
  PaymentStatus,
  VerifyPaymentInput,
} from '@housingcom/contracts';
import { paymentsConfig } from '../../../config/configuration.js';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import {
  PaymentEvent,
  type PaymentFailedEvent,
  type PaymentSucceededEvent,
} from '../../../core/events/domain-events.js';
import { UsersService } from '../../users/services/users.service.js';
import type { Payment } from '../entities/payment.entity.js';
import { PAYMENT_GATEWAY, type PaymentGateway } from '../interfaces/payment-gateway.interface.js';
import {
  PAYMENTS_REPOSITORY,
  type PaymentsRepository,
} from '../interfaces/payments-repository.interface.js';
import { toPaymentResponse } from '../mappers/payment.mapper.js';
import { parseRazorpayWebhook } from '../policies/razorpay-webhook.policy.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface OrderRequest {
  userId: string;
  purpose: PaymentPurpose;
  referenceId: string | null;
  amountInr: number;
  description: string;
  metadata: Record<string, unknown>;
}

/**
 * Gateway orders, client-side verification and webhooks. Two independent confirmations
 * (the app's signed checkout result and the server-to-server webhook) converge on one
 * conditional UPDATE, so `PaymentEvent.Succeeded` fires exactly once per payment.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject(PAYMENTS_REPOSITORY) private readonly payments: PaymentsRepository,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    @Inject(paymentsConfig.KEY) private readonly config: ConfigType<typeof paymentsConfig>,
    private readonly users: UsersService,
    private readonly events: EventEmitter2,
  ) {}

  async createOrder(req: OrderRequest): Promise<CheckoutResponse> {
    if (!this.gateway.isConfigured) {
      throw new AppException(
        ErrorCode.PaymentsUnavailable,
        'Payments are not available right now.',
        503,
      );
    }
    const user = await this.users.getById(req.userId);
    const amountPaise = Math.round(req.amountInr * 100);
    const { orderId } = await this.gateway.createOrder({
      amountPaise,
      receipt: `${req.purpose}:${Date.now().toString(36)}`.slice(0, 40),
      notes: { userId: req.userId, purpose: req.purpose, referenceId: req.referenceId ?? '' },
    });
    const payment = await this.payments.create({
      userId: req.userId,
      purpose: req.purpose,
      referenceId: req.referenceId,
      description: req.description.slice(0, 160),
      metadata: req.metadata,
      amountPaise,
      driver: this.gateway.driver,
      gatewayOrderId: orderId,
    });
    return {
      paymentId: payment.id,
      driver: this.gateway.driver,
      keyId: this.gateway.keyId,
      gatewayOrderId: orderId,
      amountPaise,
      currency: 'INR',
      businessName: this.config.businessName,
      description: payment.description,
      prefill: { name: user.fullName, email: user.email, contact: user.phone },
    };
  }

  /** Called by the app with checkout's signed result. */
  async verify(
    userId: string,
    paymentId: string,
    input: VerifyPaymentInput,
  ): Promise<PaymentResponse> {
    const payment = await this.payments.findById(paymentId);
    if (!payment || payment.userId !== userId) throw AppException.notFound('Payment');
    const valid =
      payment.gatewayOrderId === input.gatewayOrderId &&
      this.gateway.verifyCheckout(input.gatewayOrderId, input.gatewayPaymentId, input.signature);
    if (!valid) {
      throw AppException.badRequest(
        ErrorCode.PaymentVerificationFailed,
        "We couldn't confirm this payment. If money was debited, it will be confirmed automatically.",
      );
    }
    await this.fulfil(payment, input.gatewayPaymentId);
    return toPaymentResponse((await this.payments.findById(paymentId))!);
  }

  /** Razorpay → us. Invalid signatures are rejected; unknown events are acknowledged. */
  async handleWebhook(rawBody: Buffer | undefined, signature: string | undefined): Promise<void> {
    if (!rawBody || !signature || !this.gateway.verifyWebhook(rawBody, signature)) {
      throw AppException.badRequest(
        ErrorCode.PaymentVerificationFailed,
        'Invalid webhook signature',
      );
    }
    const outcome = parseRazorpayWebhook(JSON.parse(rawBody.toString('utf8')));
    if (outcome.kind === 'ignored') return;

    const payment = await this.payments.findByGatewayOrderId(outcome.orderId);
    if (!payment) {
      this.logger.warn({ orderId: outcome.orderId }, 'Webhook for an unknown order');
      return;
    }
    if (outcome.kind === 'failed') {
      if (await this.payments.markFailed(payment.id, outcome.reason)) {
        this.events.emit(PaymentEvent.Failed, {
          paymentId: payment.id,
          userId: payment.userId,
          reason: outcome.reason,
        } satisfies PaymentFailedEvent);
      }
      return;
    }
    if (outcome.amountPaise !== payment.amountPaise) {
      this.logger.error(
        { paymentId: payment.id, expected: payment.amountPaise, got: outcome.amountPaise },
        'Webhook amount mismatch; not fulfilling',
      );
      return;
    }
    await this.fulfil(payment, outcome.paymentId);
  }

  async mine(userId: string, page: number, limit: number): Promise<Paginated<PaymentResponse>> {
    const { items, meta } = await this.payments.pageForUser(userId, page, limit);
    return { items: items.map((p) => toPaymentResponse(p)), meta };
  }

  async list(
    status: PaymentStatus | undefined,
    page: number,
    limit: number,
  ): Promise<Paginated<PaymentResponse>> {
    const { items, meta } = await this.payments.page(status, page, limit);
    return { items: items.map((p) => toPaymentResponse(p, true)), meta };
  }

  async revenue(): Promise<{ last30DaysInr: number; totalInr: number }> {
    const [last30, total] = await Promise.all([
      this.payments.paidTotal(new Date(Date.now() - 30 * DAY_MS)),
      this.payments.paidTotal(),
    ]);
    return { last30DaysInr: last30 / 100, totalInr: total / 100 };
  }

  private async fulfil(payment: Payment, gatewayPaymentId: string): Promise<void> {
    const paid = await this.payments.markPaid(payment.id, gatewayPaymentId, new Date());
    if (!paid) return; // already fulfilled by the other confirmation path
    this.logger.log({ paymentId: paid.id, purpose: paid.purpose }, 'Payment received');
    // Fulfilment runs synchronously so the app sees the result as soon as verify returns.
    await this.events.emitAsync(PaymentEvent.Succeeded, {
      paymentId: paid.id,
      userId: paid.userId,
      purpose: paid.purpose,
      referenceId: paid.referenceId,
      amountInr: paid.amountPaise / 100,
      metadata: paid.metadata,
    } satisfies PaymentSucceededEvent);
  }
}
