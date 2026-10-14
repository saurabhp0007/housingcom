import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ContactChannel,
  ListingEventType,
  VisitStatus,
  type ContactOwnerResponse,
  type LeadResponse,
  type ListingCardResponse,
  type Paginated,
  type RequestVisitInput,
  type RespondVisitInput,
  type VisitResponse,
} from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import {
  EngagementEvent,
  type LeadCreatedEvent,
  type VisitEvent,
} from '../../../core/events/domain-events.js';
import { ChatService } from '../../chat/services/chat.service.js';
import { pairKey } from '../../chat/interfaces/chat-repository.interface.js';
import type { Listing } from '../../listings/entities/listing.entity.js';
import { ListingCatalogService } from '../../listings/services/listing-catalog.service.js';
import { RecommendationsService } from '../../recommendations/services/recommendations.service.js';
import { UsersService } from '../../users/services/users.service.js';
import type { Visit } from '../entities/visit.entity.js';
import {
  LEADS_REPOSITORY,
  type LeadsRepository,
} from '../interfaces/leads-repository.interface.js';
import { toLeadResponse, toPerson, toVisitResponse } from '../mappers/lead.mapper.js';
import {
  canTransitionVisit,
  isBookableDate,
  MAX_OPEN_VISITS_PER_LISTING,
  MAX_VISIT_DAYS_AHEAD,
} from '../policies/visit.policy.js';

/**
 * Customer → owner contact (PRD: call, WhatsApp, in-app chat, visit requests) and the
 * owner's lead inbox. The owner's phone is revealed only to signed-in customers, per lead.
 */
@Injectable()
export class LeadsService {
  constructor(
    @Inject(LEADS_REPOSITORY) private readonly leads: LeadsRepository,
    private readonly catalog: ListingCatalogService,
    private readonly users: UsersService,
    private readonly chat: ChatService,
    private readonly recommendations: RecommendationsService,
    private readonly events: EventEmitter2,
  ) {}

  async contact(
    customerId: string,
    listingId: string,
    channel: ContactChannel,
  ): Promise<ContactOwnerResponse> {
    const listing = await this.contactable(customerId, listingId);
    await this.recordLead(listing, customerId, channel);

    if (channel === ContactChannel.Chat) {
      return {
        channel,
        phone: null,
        conversationId: await this.chat.open(listing.id, customerId, listing.ownerId),
      };
    }
    const owner = await this.users.getById(listing.ownerId);
    return { channel, phone: owner.phone, conversationId: null };
  }

  /** Whether the user has contacted the owner (or asked to visit): the bar for reviewing. */
  hasContacted(listingId: string, customerId: string): Promise<boolean> {
    return this.leads.exists(listingId, customerId);
  }

  async requestVisit(
    customerId: string,
    listingId: string,
    input: RequestVisitInput,
  ): Promise<VisitResponse> {
    const listing = await this.contactable(customerId, listingId);
    if (!isBookableDate(input.date, new Date())) {
      throw AppException.badRequest(
        ErrorCode.VisitDateInvalid,
        `Pick a date between today and ${MAX_VISIT_DAYS_AHEAD} days from now`,
      );
    }
    if ((await this.leads.countOpenVisits(listingId, customerId)) >= MAX_OPEN_VISITS_PER_LISTING) {
      throw AppException.conflict(
        ErrorCode.Conflict,
        'You already have a visit planned here. Cancel it to pick another time.',
      );
    }

    const lead = await this.recordLead(listing, customerId, null);
    const visit = await this.leads.createVisit({
      leadId: lead.id,
      listingId,
      customerId,
      ownerId: listing.ownerId,
      date: input.date,
      slot: input.slot,
      note: input.note || null,
    });
    this.emitVisit(EngagementEvent.VisitRequested, visit, customerId);
    return this.visitResponse(visit, false);
  }

  async myVisits(
    customerId: string,
    page: number,
    limit: number,
  ): Promise<Paginated<VisitResponse>> {
    const { items, meta } = await this.leads.visitsForCustomer(customerId, page, limit);
    return { items: await this.visitResponses(items, false), meta };
  }

  async cancelVisit(customerId: string, visitId: string): Promise<VisitResponse> {
    const visit = await this.visitFor(visitId, (v) => v.customerId === customerId);
    return this.transition(visit, VisitStatus.Cancelled, 'customer', customerId);
  }

  async respondVisit(
    ownerId: string,
    visitId: string,
    input: RespondVisitInput,
  ): Promise<VisitResponse> {
    const visit = await this.visitFor(visitId, (v) => v.ownerId === ownerId);
    return this.transition(visit, input.status, 'owner', ownerId, input.note || null);
  }

  /** The lister's inbox: everyone who reached out, newest first, with their visits. */
  async ownerLeads(ownerId: string, page: number, limit: number): Promise<Paginated<LeadResponse>> {
    const { items, meta } = await this.leads.pageForOwner(ownerId, page, limit);
    const [cards, visits, conversations] = await Promise.all([
      this.catalog.cards(items.map((l) => l.listingId)),
      this.leads.visitsForLeads(items.map((l) => l.id)),
      this.chat.conversationIdsFor(
        items.map((l) => ({ listingId: l.listingId, customerId: l.customerId })),
      ),
    ]);
    return {
      items: items.flatMap((lead) => {
        const card = cards.get(lead.listingId);
        if (!card) return [];
        const customer = toPerson(lead.customerId, lead.customer, true);
        const leadVisits = visits
          .filter((v) => v.leadId === lead.id)
          .map((v) => toVisitResponse(v, card, customer));
        return [
          toLeadResponse(
            lead,
            card,
            leadVisits,
            conversations.get(pairKey(lead.listingId, lead.customerId)) ?? null,
          ),
        ];
      }),
      meta,
    };
  }

  private async contactable(customerId: string, listingId: string): Promise<Listing> {
    const listing = await this.catalog.getLive(listingId);
    if (listing.ownerId === customerId) {
      throw AppException.badRequest(ErrorCode.CannotEngageOwnListing, 'This is your own listing');
    }
    return listing;
  }

  private async recordLead(listing: Listing, customerId: string, channel: ContactChannel | null) {
    const { lead, created } = await this.leads.upsert(
      listing.id,
      customerId,
      listing.ownerId,
      channel,
      new Date(),
    );
    if (created) {
      // Contacts count once per customer, so repeated taps can't inflate popularity.
      await Promise.all([
        this.catalog.incrementContacts(listing.id),
        this.recommendations.track(customerId, listing.id, ListingEventType.Contact),
      ]);
      this.events.emit(EngagementEvent.LeadCreated, {
        leadId: lead.id,
        listingId: listing.id,
        ownerId: listing.ownerId,
        customerId,
        channel: channel ?? 'visit',
      } satisfies LeadCreatedEvent);
    }
    return lead;
  }

  private async visitFor(visitId: string, allowed: (v: Visit) => boolean): Promise<Visit> {
    const visit = await this.leads.findVisit(visitId);
    if (!visit || !allowed(visit)) throw AppException.notFound('Visit');
    return visit;
  }

  private async transition(
    visit: Visit,
    to: VisitStatus,
    actor: 'owner' | 'customer',
    actorId: string,
    ownerNote: string | null = null,
  ): Promise<VisitResponse> {
    if (!canTransitionVisit(visit.status, to, actor)) {
      throw AppException.conflict(
        ErrorCode.VisitNotPending,
        `This visit is already ${visit.status}`,
      );
    }
    await this.leads.updateVisit(visit.id, {
      status: to,
      ...(actor === 'owner' ? { ownerNote } : {}),
    });
    const updated = {
      ...visit,
      status: to,
      ownerNote: actor === 'owner' ? ownerNote : visit.ownerNote,
    };
    this.emitVisit(EngagementEvent.VisitUpdated, updated, actorId);
    return this.visitResponse(updated, actor === 'owner');
  }

  private emitVisit(name: string, v: Visit, actorId: string): void {
    this.events.emit(name, {
      visitId: v.id,
      listingId: v.listingId,
      ownerId: v.ownerId,
      customerId: v.customerId,
      status: v.status,
      date: v.date,
      slot: v.slot,
      actorId,
    } satisfies VisitEvent);
  }

  private async visitResponse(visit: Visit, sharePhone: boolean): Promise<VisitResponse> {
    return (await this.visitResponses([visit], sharePhone))[0]!;
  }

  private async visitResponses(visits: Visit[], sharePhone: boolean): Promise<VisitResponse[]> {
    const [cards, people] = await Promise.all([
      this.catalog.cards(visits.map((v) => v.listingId)),
      this.users.findMany(visits.map((v) => v.customerId)),
    ]);
    return visits.flatMap((v) => {
      const card: ListingCardResponse | undefined = cards.get(v.listingId);
      return card
        ? [toVisitResponse(v, card, toPerson(v.customerId, people.get(v.customerId), sharePhone))]
        : [];
    });
  }
}
