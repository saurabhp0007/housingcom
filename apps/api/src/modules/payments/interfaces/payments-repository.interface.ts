import type { Paginated, PaymentStatus } from '@housingcom/contracts';
import type { Payment } from '../entities/payment.entity.js';

export const PAYMENTS_REPOSITORY = Symbol('PAYMENTS_REPOSITORY');

export type CreatePaymentData = Pick<
  Payment,
  | 'userId'
  | 'purpose'
  | 'referenceId'
  | 'description'
  | 'metadata'
  | 'amountPaise'
  | 'driver'
  | 'gatewayOrderId'
>;

export interface PaymentsRepository {
  create(data: CreatePaymentData): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByGatewayOrderId(orderId: string): Promise<Payment | null>;
  /**
   * Created → paid in one conditional UPDATE. Returns the payment only for the call that
   * actually flipped it, so fulfilment runs exactly once even if checkout and webhook race.
   */
  markPaid(id: string, gatewayPaymentId: string, at: Date): Promise<Payment | null>;
  /** Created → failed only (a paid payment never becomes failed). */
  markFailed(id: string, reason: string | null): Promise<boolean>;
  pageForUser(userId: string, page: number, limit: number): Promise<Paginated<Payment>>;
  page(status: PaymentStatus | undefined, page: number, limit: number): Promise<Paginated<Payment>>;
  /** Sum of paid amounts (paise), optionally since a date. */
  paidTotal(since?: Date): Promise<number>;
}
