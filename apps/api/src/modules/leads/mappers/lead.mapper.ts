import type {
  LeadResponse,
  ListingCardResponse,
  PersonSummary,
  VisitResponse,
} from '@housingcom/contracts';
import type { User } from '../../users/entities/user.entity.js';
import type { Lead } from '../entities/lead.entity.js';
import type { Visit } from '../entities/visit.entity.js';

/** Phone numbers are shared only between the two parties of a lead. */
export const toPerson = (
  id: string,
  user: User | undefined,
  sharePhone: boolean,
): PersonSummary => ({
  id,
  name: user?.fullName ?? null,
  phone: sharePhone ? (user?.phone ?? null) : null,
});

export function toVisitResponse(
  v: Visit,
  listing: ListingCardResponse,
  customer: PersonSummary,
): VisitResponse {
  return {
    id: v.id,
    listing,
    customer,
    date: v.date,
    slot: v.slot,
    note: v.note,
    status: v.status,
    ownerNote: v.ownerNote,
    createdAt: v.createdAt.toISOString(),
  };
}

export function toLeadResponse(
  lead: Lead,
  listing: ListingCardResponse,
  visits: VisitResponse[],
  conversationId: string | null,
): LeadResponse {
  const customer = toPerson(lead.customerId, lead.customer, true);
  return {
    id: lead.id,
    listing,
    customer,
    channels: lead.channels,
    conversationId,
    lastContactAt: lead.lastContactAt.toISOString(),
    visits,
  };
}
