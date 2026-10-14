import { Inject, Injectable } from '@nestjs/common';
import type { ListingStatus } from '@housingcom/contracts';
import {
  LISTINGS_REPOSITORY,
  type ListingsRepository,
} from '../interfaces/listings-repository.interface.js';

/** Read-only aggregates other modules (admin dashboard, user management) need. */
@Injectable()
export class ListingsStatsService {
  constructor(@Inject(LISTINGS_REPOSITORY) private readonly listings: ListingsRepository) {}

  countByStatus(): Promise<Partial<Record<ListingStatus, number>>> {
    return this.listings.countByStatus();
  }

  countByOwner(ownerIds: string[]): Promise<Map<string, number>> {
    return this.listings.countByOwner(ownerIds);
  }
}
