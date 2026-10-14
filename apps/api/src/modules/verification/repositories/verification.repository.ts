import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationStatus, type Paginated } from '@housingcom/contracts';
import { buildPaginationMeta } from '../../../core/utils/pagination.util.js';
import { VerificationRequest } from '../entities/verification-request.entity.js';
import type { VerificationRepository } from '../interfaces/verification-repository.interface.js';

@Injectable()
export class TypeOrmVerificationRepository implements VerificationRepository {
  constructor(@InjectRepository(VerificationRequest) private readonly requests: Repository<VerificationRequest>) {}

  create(data: Pick<VerificationRequest, 'userId' | 'idDocumentKey' | 'propertyDocumentKey'>) {
    return this.requests.save(this.requests.create(data));
  }

  findById(id: string) {
    return this.requests.findOne({ where: { id }, relations: { user: { listerProfile: true } } });
  }

  findLatestForUser(userId: string) {
    return this.requests.findOne({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async hasPending(userId: string): Promise<boolean> {
    return (await this.requests.countBy({ userId, status: VerificationStatus.Pending })) > 0;
  }

  async findByStatus(status: VerificationStatus, page: number, limit: number): Promise<Paginated<VerificationRequest>> {
    const [items, total] = await this.requests.findAndCount({
      where: { status },
      relations: { user: { listerProfile: true } },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  countByStatus(status: VerificationStatus): Promise<number> {
    return this.requests.countBy({ status });
  }

  async review(id: string, data: Pick<VerificationRequest, 'status' | 'reviewedBy' | 'reviewedAt' | 'rejectionReason'>) {
    await this.requests.update({ id }, data);
  }
}
