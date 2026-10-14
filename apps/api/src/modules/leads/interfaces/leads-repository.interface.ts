import type { ContactChannel, Paginated } from '@housingcom/contracts';
import type { Lead } from '../entities/lead.entity.js';
import type { Visit } from '../entities/visit.entity.js';

export const LEADS_REPOSITORY = Symbol('LEADS_REPOSITORY');

export interface UpsertLeadResult {
  lead: Lead;
  /** True the first time this customer reached out about this listing. */
  created: boolean;
}

export interface LeadsRepository {
  /** Creates the lead or adds the channel to it, bumping lastContactAt. */
  upsert(
    listingId: string,
    customerId: string,
    ownerId: string,
    channel: ContactChannel | null,
    at: Date,
  ): Promise<UpsertLeadResult>;
  exists(listingId: string, customerId: string): Promise<boolean>;
  pageForOwner(ownerId: string, page: number, limit: number): Promise<Paginated<Lead>>;

  createVisit(
    data: Pick<Visit, 'leadId' | 'listingId' | 'customerId' | 'ownerId' | 'date' | 'slot' | 'note'>,
  ): Promise<Visit>;
  findVisit(id: string): Promise<Visit | null>;
  countOpenVisits(listingId: string, customerId: string): Promise<number>;
  updateVisit(id: string, data: Partial<Pick<Visit, 'status' | 'ownerNote'>>): Promise<void>;
  visitsForCustomer(customerId: string, page: number, limit: number): Promise<Paginated<Visit>>;
  visitsForLeads(leadIds: string[]): Promise<Visit[]>;
}
