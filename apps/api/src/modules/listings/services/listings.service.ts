import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  LISTING_LIMITS,
  ListingAction,
  ListingStatus,
  MediaKind,
  listingSubmitSchema,
  type ListingDetailResponse,
  type MyListingResponse,
} from '@housingcom/contracts';
import type { DeepPartial } from 'typeorm';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import { ListingEvent, type ListingStatusEvent } from '../../../core/events/domain-events.js';
import { fromPoint, toPoint } from '../../../core/utils/geo.util.js';
import { GeoService } from '../../geo/services/geo.service.js';
import { UsersService } from '../../users/services/users.service.js';
import type { CreateListingDto, UpdateListingDto } from '../dto/listing.dto.js';
import type { Listing } from '../entities/listing.entity.js';
import {
  LISTING_MEDIA_REPOSITORY,
  type ListingMediaRepository,
} from '../interfaces/listing-media-repository.interface.js';
import { LISTINGS_REPOSITORY, type ListingsRepository } from '../interfaces/listings-repository.interface.js';
import { ListingMapper } from '../mappers/listing.mapper.js';
import { transition, type TransitionContext } from '../policies/listing-status.policy.js';
import { ListingDetailsService } from './listing-details.service.js';

type LifecycleAction = typeof ListingAction.Pause | typeof ListingAction.Resume | typeof ListingAction.MarkFilled;

/** Everything a lister does with their own listings. */
@Injectable()
export class ListingsService {
  constructor(
    @Inject(LISTINGS_REPOSITORY) private readonly listings: ListingsRepository,
    @Inject(LISTING_MEDIA_REPOSITORY) private readonly media: ListingMediaRepository,
    private readonly users: UsersService,
    private readonly geo: GeoService,
    private readonly mapper: ListingMapper,
    private readonly details: ListingDetailsService,
    private readonly events: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateListingDto): Promise<ListingDetailResponse> {
    await this.listerContext(userId);
    const listing = await this.listings.create({
      ...(await this.toColumns(dto)),
      ownerId: userId,
      type: dto.type,
      status: ListingStatus.Draft,
    });
    return this.details.forPrivileged(listing.id);
  }

  async mine(userId: string, status?: ListingStatus): Promise<MyListingResponse[]> {
    await this.listerContext(userId);
    return (await this.listings.findByOwner(userId, status)).map((r) => this.mapper.mine(r));
  }

  async getOwned(userId: string, id: string): Promise<ListingDetailResponse> {
    await this.assertOwned(userId, id);
    return this.details.forPrivileged(id);
  }

  async update(userId: string, id: string, dto: UpdateListingDto): Promise<ListingDetailResponse> {
    const listing = await this.assertOwned(userId, id);
    const columns = await this.toColumns(dto);
    await this.applyEdit(listing, userId, columns);
    return this.details.forPrivileged(id);
  }

  /**
   * Called for any content change (fields or photos). Unverified listers' edits to live
   * listings go back to review, so unreviewed content never reaches the public.
   */
  async applyEdit(listing: Listing, userId: string, columns: DeepPartial<Listing> = {}): Promise<void> {
    const result = transition(listing.status, ListingAction.Edit, await this.listerContext(userId));
    if (!result.allowed) throw this.notAllowed(result.reason);

    const statusChanged = result.next !== listing.status;
    await this.listings.update(listing.id, {
      ...columns,
      ...(statusChanged ? { status: result.next, submittedAt: new Date() } : {}),
    });
    if (statusChanged) this.emitStatus(listing, result.next, userId);
  }

  /** Validates completeness, then goes live (verified lister) or into the review queue. */
  async submit(userId: string, id: string): Promise<ListingDetailResponse> {
    const listing = await this.assertOwned(userId, id);
    const result = transition(listing.status, ListingAction.Submit, await this.listerContext(userId));
    if (!result.allowed) throw this.notAllowed(result.reason);

    await this.assertComplete(listing);

    const now = new Date();
    await this.listings.update(id, {
      status: result.next,
      submittedAt: now,
      rejectionReason: null,
      ...(result.next === ListingStatus.Live && !listing.publishedAt ? { publishedAt: now } : {}),
    });
    this.emitStatus(listing, result.next, userId);
    this.events.emit(result.next === ListingStatus.Live ? ListingEvent.Published : ListingEvent.Submitted, {
      listingId: id,
      ownerId: userId,
      from: listing.status,
      to: result.next,
      actorId: userId,
    } satisfies ListingStatusEvent);
    return this.details.forPrivileged(id);
  }

  async changeLifecycle(userId: string, id: string, action: LifecycleAction): Promise<ListingDetailResponse> {
    const listing = await this.assertOwned(userId, id);
    const result = transition(listing.status, action, await this.listerContext(userId));
    if (!result.allowed) throw this.notAllowed(result.reason);

    await this.listings.update(id, { status: result.next });
    this.emitStatus(listing, result.next, userId);
    return this.details.forPrivileged(id);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.assertOwned(userId, id);
    await this.listings.softDelete(id);
  }

  /** Loads a listing the user owns (404 otherwise, so IDs of others' listings are not revealed). */
  async assertOwned(userId: string, id: string): Promise<Listing> {
    const listing = await this.listings.findById(id);
    if (!listing || listing.ownerId !== userId) throw AppException.notFound('Listing');
    return listing;
  }

  private async listerContext(userId: string): Promise<TransitionContext> {
    const user = await this.users.getById(userId);
    if (!user.listerProfile) {
      throw AppException.forbidden(ErrorCode.NotALister, 'Switch to lister mode to manage listings');
    }
    return { isVerifiedLister: user.listerProfile.isVerified };
  }

  private async assertComplete(listing: Listing): Promise<void> {
    const parsed = listingSubmitSchema.safeParse({
      type: listing.type,
      title: listing.title,
      description: listing.description,
      rent: listing.rent,
      deposit: listing.deposit,
      sharing: listing.sharing,
      gender: listing.gender,
      furnishing: listing.furnishing,
      foodIncluded: listing.foodIncluded,
      amenities: listing.amenities,
      houseRules: listing.houseRules,
      availableFrom: listing.availableFrom,
      address: listing.address,
      location: listing.location ? fromPoint(listing.location) : undefined,
    });
    const missing = parsed.success ? [] : parsed.error.issues.map((i) => i.path.join('.') || 'listing');

    const images = await this.media.countByKind(listing.id, MediaKind.Image);
    if (images < LISTING_LIMITS.minImagesToSubmit) missing.push('photos');

    if (missing.length > 0) {
      throw AppException.badRequest(ErrorCode.ListingIncomplete, 'Complete the listing before submitting', {
        missing: [...new Set(missing)],
      });
    }
  }

  /** DTO → columns. The map pin decides the area and city, so they can never disagree. */
  private async toColumns(dto: UpdateListingDto): Promise<DeepPartial<Listing>> {
    const { location, houseRules, ...rest } = dto;
    const columns: DeepPartial<Listing> = { ...rest };
    if (houseRules !== undefined) columns.houseRules = houseRules?.trim() ? houseRules.trim() : null;

    if (location) {
      const resolved = await this.geo.resolve(location);
      if (!resolved.isServiceable || !resolved.area || !resolved.city) {
        throw AppException.badRequest(
          ErrorCode.LocationNotServiceable,
          "We don't operate in this area yet. Move the pin to a supported city.",
        );
      }
      Object.assign(columns, { location: toPoint(location), areaId: resolved.area.id, cityId: resolved.city.id });
    }
    return columns;
  }

  private emitStatus(listing: Listing, to: ListingStatus, actorId: string): void {
    this.events.emit(ListingEvent.StatusChanged, {
      listingId: listing.id,
      ownerId: listing.ownerId,
      from: listing.status,
      to,
      actorId,
    } satisfies ListingStatusEvent);
  }

  private notAllowed(reason: string): AppException {
    return AppException.conflict(ErrorCode.ListingTransitionNotAllowed, reason);
  }
}
