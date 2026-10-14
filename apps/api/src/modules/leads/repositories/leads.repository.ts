import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { VisitStatus, type ContactChannel, type Paginated } from '@housingcom/contracts';
import { buildPaginationMeta } from '../../../core/utils/pagination.util.js';
import { Lead } from '../entities/lead.entity.js';
import { Visit } from '../entities/visit.entity.js';
import type {
  LeadsRepository,
  UpsertLeadResult,
} from '../interfaces/leads-repository.interface.js';

@Injectable()
export class TypeOrmLeadsRepository implements LeadsRepository {
  constructor(
    @InjectRepository(Lead) private readonly leads: Repository<Lead>,
    @InjectRepository(Visit) private readonly visits: Repository<Visit>,
  ) {}

  async upsert(
    listingId: string,
    customerId: string,
    ownerId: string,
    channel: ContactChannel | null,
    at: Date,
  ): Promise<UpsertLeadResult> {
    // One statement, race-free: `xmax = 0` is true only for a freshly inserted row.
    const rows: { id: string; inserted: boolean }[] = await this.leads.query(
      `INSERT INTO leads (listing_id, customer_id, owner_id, channels, last_contact_at)
       VALUES ($1, $2, $3, $4::text[], $5)
       ON CONFLICT (listing_id, customer_id) DO UPDATE SET
         channels = CASE WHEN $6::text IS NULL OR $6::text = ANY(leads.channels)
                         THEN leads.channels ELSE array_append(leads.channels, $6::text) END,
         last_contact_at = EXCLUDED.last_contact_at,
         updated_at = now()
       RETURNING id, (xmax = 0) AS inserted`,
      [listingId, customerId, ownerId, channel ? [channel] : [], at, channel],
    );
    const row = rows[0]!;
    return { lead: await this.leads.findOneByOrFail({ id: row.id }), created: row.inserted };
  }

  async exists(listingId: string, customerId: string): Promise<boolean> {
    return (await this.leads.countBy({ listingId, customerId })) > 0;
  }

  async pageForOwner(ownerId: string, page: number, limit: number): Promise<Paginated<Lead>> {
    const [items, total] = await this.leads.findAndCount({
      where: { ownerId },
      relations: { customer: true },
      order: { lastContactAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  createVisit(
    data: Pick<Visit, 'leadId' | 'listingId' | 'customerId' | 'ownerId' | 'date' | 'slot' | 'note'>,
  ): Promise<Visit> {
    return this.visits.save(this.visits.create(data));
  }

  findVisit(id: string): Promise<Visit | null> {
    return this.visits.findOneBy({ id });
  }

  countOpenVisits(listingId: string, customerId: string): Promise<number> {
    return this.visits.countBy({
      listingId,
      customerId,
      status: In([VisitStatus.Requested, VisitStatus.Confirmed]),
    });
  }

  async updateVisit(id: string, data: Partial<Pick<Visit, 'status' | 'ownerNote'>>): Promise<void> {
    await this.visits.update({ id }, data);
  }

  async visitsForCustomer(
    customerId: string,
    page: number,
    limit: number,
  ): Promise<Paginated<Visit>> {
    const [items, total] = await this.visits.findAndCount({
      where: { customerId },
      order: { date: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  visitsForLeads(leadIds: string[]): Promise<Visit[]> {
    if (leadIds.length === 0) return Promise.resolve([]);
    return this.visits.find({ where: { leadId: In(leadIds) }, order: { date: 'DESC' } });
  }
}
