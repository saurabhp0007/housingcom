import type { PaymentResponse } from '@housingcom/contracts';
import type { Payment } from '../entities/payment.entity.js';

export function toPaymentResponse(p: Payment, includeUser = false): PaymentResponse {
  return {
    id: p.id,
    status: p.status,
    amountInr: p.amountPaise / 100,
    description: p.description,
    listingId: p.referenceId,
    gatewayOrderId: p.gatewayOrderId,
    gatewayPaymentId: p.gatewayPaymentId,
    failureReason: p.failureReason,
    createdAt: p.createdAt.toISOString(),
    paidAt: p.paidAt?.toISOString() ?? null,
    ...(includeUser
      ? { user: { id: p.userId, name: p.user?.fullName ?? null, phone: p.user?.phone ?? null } }
      : {}),
  };
}
