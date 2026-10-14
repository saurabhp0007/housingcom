import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentStatus, type Paginated } from '@housingcom/contracts';
import { buildPaginationMeta } from '../../../core/utils/pagination.util.js';
import { Payment } from '../entities/payment.entity.js';
import type {
  CreatePaymentData,
  PaymentsRepository,
} from '../interfaces/payments-repository.interface.js';

@Injectable()
export class TypeOrmPaymentsRepository implements PaymentsRepository {
  constructor(@InjectRepository(Payment) private readonly payments: Repository<Payment>) {}

  create(data: CreatePaymentData): Promise<Payment> {
    return this.payments.save(this.payments.create(data));
  }

  findById(id: string): Promise<Payment | null> {
    return this.payments.findOneBy({ id });
  }

  findByGatewayOrderId(gatewayOrderId: string): Promise<Payment | null> {
    return this.payments.findOneBy({ gatewayOrderId });
  }

  async markPaid(id: string, gatewayPaymentId: string, at: Date): Promise<Payment | null> {
    const result = await this.payments
      .createQueryBuilder()
      .update()
      .set({ status: PaymentStatus.Paid, gatewayPaymentId, paidAt: at, failureReason: null })
      .where('id = :id AND status <> :paid', { id, paid: PaymentStatus.Paid })
      .execute();
    return result.affected ? this.findById(id) : null;
  }

  async markFailed(id: string, reason: string | null): Promise<boolean> {
    const result = await this.payments.update(
      { id, status: PaymentStatus.Created },
      { status: PaymentStatus.Failed, failureReason: reason?.slice(0, 300) ?? null },
    );
    return (result.affected ?? 0) > 0;
  }

  async pageForUser(userId: string, page: number, limit: number): Promise<Paginated<Payment>> {
    const [items, total] = await this.payments.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async page(
    status: PaymentStatus | undefined,
    page: number,
    limit: number,
  ): Promise<Paginated<Payment>> {
    const [items, total] = await this.payments.findAndCount({
      where: status ? { status } : {},
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async paidTotal(since?: Date): Promise<number> {
    const qb = this.payments
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount_paise), 0)', 'total')
      .where('p.status = :paid', { paid: PaymentStatus.Paid });
    if (since) qb.andWhere('p.paid_at >= :since', { since });
    const row = await qb.getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }
}
