/** What a Razorpay webhook means for us. */
export type WebhookOutcome =
  | { kind: 'paid'; orderId: string; paymentId: string; amountPaise: number }
  | { kind: 'failed'; orderId: string; reason: string | null }
  | { kind: 'ignored'; event: string };

interface RazorpayPaymentEntity {
  id?: string;
  order_id?: string;
  amount?: number;
  status?: string;
  error_description?: string | null;
}

interface RazorpayWebhook {
  event?: string;
  payload?: {
    payment?: { entity?: RazorpayPaymentEntity };
    order?: { entity?: { id?: string; amount_paid?: number } };
  };
}

/**
 * Maps webhook events to outcomes (https://razorpay.com/docs/webhooks/payments/).
 * payment.captured and order.paid both mean "money received"; payment.failed is a failed
 * attempt (the customer may still retry on the same order). Pure, so it is unit-tested.
 */
export function parseRazorpayWebhook(body: unknown): WebhookOutcome {
  const hook = (body ?? {}) as RazorpayWebhook;
  const event = hook.event ?? 'unknown';
  const payment = hook.payload?.payment?.entity;

  switch (event) {
    case 'payment.captured':
    case 'order.paid': {
      const orderId = payment?.order_id ?? hook.payload?.order?.entity?.id;
      if (!orderId || !payment?.id || typeof payment.amount !== 'number') {
        return { kind: 'ignored', event };
      }
      return { kind: 'paid', orderId, paymentId: payment.id, amountPaise: payment.amount };
    }
    case 'payment.failed':
      return payment?.order_id
        ? { kind: 'failed', orderId: payment.order_id, reason: payment.error_description ?? null }
        : { kind: 'ignored', event };
    default:
      return { kind: 'ignored', event };
  }
}
