import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PaymentDriver } from '@housingcom/contracts';
import { paymentsConfig } from '../../../config/configuration.js';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import type { CreateOrderInput, PaymentGateway } from '../interfaces/payment-gateway.interface.js';
import { hmacSha256Hex, signaturesMatch } from '../utils/hmac.util.js';

const API_BASE = 'https://api.razorpay.com/v1';
const TIMEOUT_MS = 10_000;

/**
 * Razorpay Orders API + signature checks (https://razorpay.com/docs/payments/server-integration/).
 * Plain HTTPS; no SDK needed for these three calls.
 */
@Injectable()
export class RazorpayGateway implements PaymentGateway {
  readonly driver = PaymentDriver.Razorpay;
  private readonly logger = new Logger(RazorpayGateway.name);

  constructor(
    @Inject(paymentsConfig.KEY) private readonly config: ConfigType<typeof paymentsConfig>,
  ) {}

  get keyId(): string {
    return this.config.razorpay.keyId ?? '';
  }

  get isConfigured(): boolean {
    const { keyId, keySecret } = this.config.razorpay;
    return !!keyId && !!keySecret;
  }

  async createOrder({
    amountPaise,
    receipt,
    notes,
  }: CreateOrderInput): Promise<{ orderId: string }> {
    const { keyId, keySecret } = this.config.razorpay;
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt, notes }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch((err: unknown) => {
      this.logger.error({ err }, 'Razorpay unreachable');
      return null;
    });
    if (!res?.ok) {
      this.logger.error({ status: res?.status, body: await res?.text() }, 'Razorpay order failed');
      throw new AppException(
        ErrorCode.PaymentGatewayError,
        'Could not start the payment. Please try again.',
        502,
      );
    }
    const order = (await res.json()) as { id: string };
    return { orderId: order.id };
  }

  verifyCheckout(orderId: string, paymentId: string, signature: string): boolean {
    const secret = this.config.razorpay.keySecret;
    return !!secret && signaturesMatch(hmacSha256Hex(secret, `${orderId}|${paymentId}`), signature);
  }

  verifyWebhook(rawBody: Buffer, signature: string): boolean {
    const secret = this.config.razorpay.webhookSecret;
    return !!secret && signaturesMatch(hmacSha256Hex(secret, rawBody), signature);
  }
}
