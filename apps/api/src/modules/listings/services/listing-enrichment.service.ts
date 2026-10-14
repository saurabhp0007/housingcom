import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { NearbyPlaceCategory } from '@housingcom/contracts';
import { haversineKm } from '@housingcom/utils';
import { QueueName } from '../../../core/queue/queue.constants.js';
import { fromPoint } from '../../../core/utils/geo.util.js';
import {
  PLACES_PROVIDER,
  type PlacesProvider,
} from '../../places/interfaces/places-provider.interface.js';
import {
  LISTINGS_REPOSITORY,
  type ListingsRepository,
} from '../interfaces/listings-repository.interface.js';

export const NEARBY_JOB = 'nearby-places';
const SEARCH_RADIUS_M = 3000;

export interface NearbyJob {
  listingId: string;
}

/**
 * Background enrichment: distance to the nearest metro, bus stop, college and hospital
 * (PRD §3 "Nearby places"). Runs once per publish / location change, not per view.
 */
@Injectable()
export class ListingEnrichmentService {
  private readonly logger = new Logger(ListingEnrichmentService.name);

  constructor(
    @InjectQueue(QueueName.ListingEnrichment) private readonly queue: Queue<NearbyJob>,
    @Inject(LISTINGS_REPOSITORY) private readonly listings: ListingsRepository,
    @Inject(PLACES_PROVIDER) private readonly places: PlacesProvider,
  ) {}

  async schedule(listingId: string): Promise<void> {
    if (!this.places.isEnabled) return;
    // Same job id while queued: repeated edits collapse into one lookup.
    await this.queue.add(
      NEARBY_JOB,
      { listingId },
      {
        jobId: `nearby-${listingId}`,
        delay: 5_000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: true,
        removeOnFail: 500,
      },
    );
  }

  async computeNearby(listingId: string): Promise<void> {
    const listing = await this.listings.findById(listingId);
    if (!listing?.location) return;
    const point = fromPoint(listing.location);

    const results = await Promise.all(
      Object.values(NearbyPlaceCategory).map(async (category) => {
        const place = await this.places.nearest(category, point, SEARCH_RADIUS_M);
        return place
          ? {
              category,
              name: place.name.slice(0, 160),
              distanceM: Math.round(haversineKm(point, place.location) * 1000),
            }
          : null;
      }),
    );
    const found = results.filter((r): r is NonNullable<typeof r> => r !== null);
    await this.listings.replaceNearbyPlaces(listingId, found);
    this.logger.log({ listingId, found: found.length }, 'Nearby places updated');
  }
}
