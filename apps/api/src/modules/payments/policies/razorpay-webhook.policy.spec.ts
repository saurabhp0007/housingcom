import { parseRazorpayWebhook } from './razorpay-webhook.policy.js';

const payment = { id: 'pay_1', order_id: 'order_1', amount: 49900, status: 'captured' };

describe('parseRazorpayWebhook', () => {
  it('treats payment.captured and order.paid as paid', () => {
    expect(
      parseRazorpayWebhook({
        event: 'payment.captured',
        payload: { payment: { entity: payment } },
      }),
    ).toEqual({
      kind: 'paid',
      orderId: 'order_1',
      paymentId: 'pay_1',
      amountPaise: 49900,
    });
    expect(
      parseRazorpayWebhook({
        event: 'order.paid',
        payload: {
          order: { entity: { id: 'order_1' } },
          payment: { entity: { ...payment, order_id: undefined } },
        },
      }),
    ).toMatchObject({ kind: 'paid', orderId: 'order_1' });
  });

  it('maps failures with the reason', () => {
    expect(
      parseRazorpayWebhook({
        event: 'payment.failed',
        payload: { payment: { entity: { ...payment, error_description: 'Card declined' } } },
      }),
    ).toEqual({ kind: 'failed', orderId: 'order_1', reason: 'Card declined' });
  });

  it('ignores other or malformed events', () => {
    expect(parseRazorpayWebhook({ event: 'refund.created' })).toEqual({
      kind: 'ignored',
      event: 'refund.created',
    });
    expect(parseRazorpayWebhook({ event: 'payment.captured', payload: {} }).kind).toBe('ignored');
    expect(parseRazorpayWebhook(null).kind).toBe('ignored');
  });
});
