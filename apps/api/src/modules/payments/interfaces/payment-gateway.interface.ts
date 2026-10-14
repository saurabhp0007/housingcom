import type { PaymentDriver } from '@housingcom/contracts';

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface CreateOrderInput {
  amountPaise: number;
  /** Our reference shown in the gateway dashboard (≤ 40 chars). */
  receipt: string;
  notes: Record<string, string>;
}

/** The surface we need from an Indian payment gateway (Razorpay today). */
export interface PaymentGateway {
  readonly driver: PaymentDriver;
  /** Public key the app's checkout needs. */
  readonly keyId: string;
  readonly isConfigured: boolean;
  createOrder(input: CreateOrderInput): Promise<{ orderId: string }>;
  /** Checks the signature the app receives from checkout. */
  verifyCheckout(orderId: string, paymentId: string, signature: string): boolean;
  /** Checks a webhook's signature over the exact raw body. */
  verifyWebhook(rawBody: Buffer, signature: string): boolean;
}
