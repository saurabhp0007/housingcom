import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ListingAction,
  ListingStatus,
  type ListingDetailResponse,
  type MyListingResponse,
  type Paginated,
} from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import { ListingEvent, type ListingStatusEvent } from '../../../core/events/domain-events.js';
import { LISTINGS_REPOSITORY, type ListingsRepository } from '../interfaces/listings-repository.interface.js';
import { ListingMapper } from '../mappers/listing.mapper.js';
import { transition } from '../policies/listing-status.policy.js';
import { ListingDetailsService } from './listing-details.service.js';

/** Admin approval queue: approve, or reject with a reason the lister sees. */
@Injectable()
export class ListingModerationService {
  constructor(
    @Inject(LISTINGS_REPOSITORY) private readonly listings: ListingsRepository,
    private readonly details: ListingDetailsService,
    private readonly mapper: ListingMapper,
    private readonly events: EventEmitter2,
  ) {}

  async queue(status: ListingStatus, page: number, limit: number): Promise<Paginated<MyListingResponse>> {
    const result = await this.listings.findByStatus(status, page, limit);
    return { items: result.items.map((r) => this.mapper.mine(r)), meta: result.meta };
  }

  get(id: string): Promise<ListingDetailResponse> {
    return this.details.forPrivileged(id);
  }

  async approve(adminId: string, id: string): Promise<ListingDetailResponse> {
    const listing = await this.load(id);
    const result = transition(listing.status, ListingAction.Approve, { isVerifiedLister: false });
    if (!result.allowed) throw AppException.conflict(ErrorCode.ListingTransitionNotAllowed, result.reason);

    await this.listings.update(id, {
      status: ListingStatus.Live,
      rejectionReason: null,
      ...(listing.publishedAt ? {} : { publishedAt: new Date() }),
    });
    this.emit(ListingEvent.Approved, { listingId: id, ownerId: listing.ownerId, from: listing.status, to: ListingStatus.Live, actorId: adminId });
    return this.details.forPrivileged(id);
  }

  async reject(adminId: string, id: string, reason: string): Promise<ListingDetailResponse> {
    const listing = await this.load(id);
    const result = transition(listing.status, ListingAction.Reject, { isVerifiedLister: false });
    if (!result.allowed) throw AppException.conflict(ErrorCode.ListingTransitionNotAllowed, result.reason);

    await this.listings.update(id, { status: ListingStatus.Rejected, rejectionReason: reason });
    this.emit(ListingEvent.Rejected, {
      listingId: id,
      ownerId: listing.ownerId,
      from: listing.status,
      to: ListingStatus.Rejected,
      actorId: adminId,
      reason,
    });
    return this.details.forPrivileged(id);
  }

  private async load(id: string) {
    const listing = await this.listings.findById(id);
    if (!listing) throw AppException.notFound('Listing');
    return listing;
  }

  private emit(name: string, event: ListingStatusEvent): void {
    this.events.emit(name, event);
    this.events.emit(ListingEvent.StatusChanged, event);
  }
}
