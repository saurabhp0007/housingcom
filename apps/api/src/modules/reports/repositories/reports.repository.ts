import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportStatus, type Paginated } from '@housingcom/contracts';
import { buildPaginationMeta } from '../../../core/utils/pagination.util.js';
import { Report } from '../entities/report.entity.js';
import type { ReportsRepository } from '../interfaces/reports-repository.interface.js';

type Resolution = Pick<Report, 'status' | 'resolutionNote' | 'resolvedBy' | 'resolvedAt'>;

@Injectable()
export class TypeOrmReportsRepository implements ReportsRepository {
  constructor(@InjectRepository(Report) private readonly reports: Repository<Report>) {}

  create(data: Pick<Report, 'listingId' | 'reporterId' | 'reason' | 'details'>): Promise<Report> {
    return this.reports.save(this.reports.create(data));
  }

  findById(id: string): Promise<Report | null> {
    return this.reports.findOne({ where: { id }, relations: { reporter: true } });
  }

  async hasOpen(listingId: string, reporterId: string): Promise<boolean> {
    return (await this.reports.countBy({ listingId, reporterId, status: ReportStatus.Open })) > 0;
  }

  async pageByStatus(
    status: ReportStatus,
    page: number,
    limit: number,
  ): Promise<Paginated<Report>> {
    const [items, total] = await this.reports.findAndCount({
      where: { status },
      relations: { reporter: true },
      order: { createdAt: status === ReportStatus.Open ? 'ASC' : 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async openCountsByListing(listingIds: string[]): Promise<Map<string, number>> {
    if (listingIds.length === 0) return new Map();
    const rows = await this.reports
      .createQueryBuilder('r')
      .select('r.listing_id', 'listingId')
      .addSelect('COUNT(*)', 'count')
      .where('r.listing_id IN (:...listingIds)', { listingIds: [...new Set(listingIds)] })
      .andWhere('r.status = :open', { open: ReportStatus.Open })
      .groupBy('r.listing_id')
      .getRawMany<{ listingId: string; count: string }>();
    return new Map(rows.map((r) => [r.listingId, Number(r.count)]));
  }

  countByStatus(status: ReportStatus): Promise<number> {
    return this.reports.countBy({ status });
  }

  async resolve(id: string, data: Resolution): Promise<void> {
    await this.reports.update({ id }, data);
  }

  async resolveOpenForListing(listingId: string, data: Resolution): Promise<void> {
    await this.reports.update({ listingId, status: ReportStatus.Open }, data);
  }
}
