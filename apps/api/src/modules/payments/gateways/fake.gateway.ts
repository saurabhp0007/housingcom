import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { FAKE_CHECKOUT, PaymentDriver } from '@housingcom/contracts';
import { paymentsConfig } from '../../../config/configuration.js';
import type { CreateOrderInput, PaymentGateway } from '../interfaces/payment-gateway.interface.js';
import { hmacSha256Hex, signaturesMatch } from '../utils/hmac.util.js';

/**
 * Development/test stand-in (PAYMENTS_DRIVER=fake; refused in production by env validation).
 * Orders are local ids; webhooks use the same HMAC scheme as Razorpay so that path is testable.
 */
@Injectable()
export class FakeGateway implements PaymentGateway {
  readonly driver = PaymentDriver.Fake;
  readonly keyId = 'rzp_test_fake';
  readonly isConfigured = true;

  constructor(
    @Inject(paymentsConfig.KEY) private readonly config: ConfigType<typeof paymentsConfig>,
  ) {}

  async createOrder(_input: CreateOrderInput): Promise<{ orderId: string }> {
    return { orderId: `order_fake_${randomBytes(8).toString('hex')}` };
  }

  verifyCheckout(_orderId: string, paymentId: string, signature: string): boolean {
    return (
      paymentId.startsWith(FAKE_CHECKOUT.paymentIdPrefix) && signature === FAKE_CHECKOUT.signature
    );
  }

  verifyWebhook(rawBody: Buffer, signature: string): boolean {
    const secret = this.config.razorpay.webhookSecret;
    return !!secret && signaturesMatch(hmacSha256Hex(secret, rawBody), signature);
  }
}
