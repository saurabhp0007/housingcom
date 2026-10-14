import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Queue } from 'bullmq';
import { ListingStatus } from '@housingcom/contracts';
import {
  EngagementEvent,
  type SavedSearchMatchedEvent,
} from '../../../core/events/domain-events.js';
import { QueueName } from '../../../core/queue/queue.constants.js';
import { fromPoint } from '../../../core/utils/geo.util.js';
import { ListingCatalogService } from '../../listings/services/listing-catalog.service.js';
import {
  SAVED_SEARCHES_REPOSITORY,
  type SavedSearchesRepository,
} from '../interfaces/saved-searches-repository.interface.js';
import { matchesFilters } from '../policies/saved-search-match.policy.js';

export const MATCH_JOB = 'match-listing';
const PAGE_SIZE = 500;

export interface MatchJob {
  listingId: string;
}

/** "Alert me about new listings like this": runs off the request path when a listing goes live. */
@Injectable()
export class SavedSearchAlertsService {
  private readonly logger = new Logger(SavedSearchAlertsService.name);

  constructor(
    @InjectQueue(QueueName.SavedSearchAlerts) private readonly queue: Queue<MatchJob>,
    @Inject(SAVED_SEARCHES_REPOSITORY) private readonly searches: SavedSearchesRepository,
    private readonly catalog: ListingCatalogService,
    private readonly events: EventEmitter2,
  ) {}

  async schedule(listingId: string): Promise<void> {
    await this.queue.add(
      MATCH_JOB,
      { listingId },
      {
        jobId: `match-${listingId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: true,
        removeOnFail: 500,
      },
    );
  }

  async match(listingId: string): Promise<number> {
    const listing = await this.catalog.get(listingId).catch(() => null);
    if (!listing || listing.status !== ListingStatus.Live || !listing.location) return 0;
    const facts = {
      type: listing.type,
      rent: listing.rent,
      sharing: listing.sharing,
      gender: listing.gender,
      furnishing: listing.furnishing,
      foodIncluded: listing.foodIncluded,
      amenities: listing.amenities,
      availableFrom: listing.availableFrom,
      text: [listing.title, listing.description, listing.address].filter(Boolean).join(' '),
    };

    let alerted = 0;
    let after: string | null = null;
    for (;;) {
      const page = await this.searches.alertCandidates(
        fromPoint(listing.location),
        listing.ownerId,
        after,
        PAGE_SIZE,
      );
      for (const search of page) {
        if (!matchesFilters(facts, search.filters)) continue;
        if (!(await this.searches.recordAlert(search.id, listing.id))) continue;
        alerted++;
        this.events.emit(EngagementEvent.SavedSearchMatched, {
          userId: search.userId,
          savedSearchId: search.id,
          label: search.label,
          listingId: listing.id,
        } satisfies SavedSearchMatchedEvent);
      }
      if (page.length < PAGE_SIZE) break;
      after = page[page.length - 1]!.id;
    }
    this.logger.log({ listingId, alerted }, 'Saved-search alerts sent');
    return alerted;
  }
}
