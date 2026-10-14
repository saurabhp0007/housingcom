import { Inject, Injectable } from '@nestjs/common';
import type { SavedSearchInput, SavedSearchResponse } from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import type { SavedSearch } from '../entities/saved-search.entity.js';
import {
  SAVED_SEARCHES_REPOSITORY,
  type SavedSearchData,
  type SavedSearchesRepository,
} from '../interfaces/saved-searches-repository.interface.js';
import { toSavedSearchResponse } from '../mappers/saved-search.mapper.js';
import { MAX_SAVED_SEARCHES } from '../policies/saved-search-match.policy.js';

const toData = (i: SavedSearchInput): SavedSearchData => ({
  label: i.label,
  center: { lat: i.lat, lng: i.lng },
  radiusKm: i.radiusKm,
  filters: i.filters,
  alertsEnabled: i.alertsEnabled,
});

@Injectable()
export class SavedSearchesService {
  constructor(
    @Inject(SAVED_SEARCHES_REPOSITORY) private readonly searches: SavedSearchesRepository,
  ) {}

  async list(userId: string): Promise<SavedSearchResponse[]> {
    return (await this.searches.listForUser(userId)).map(toSavedSearchResponse);
  }

  async create(userId: string, input: SavedSearchInput): Promise<SavedSearchResponse> {
    if ((await this.searches.countForUser(userId)) >= MAX_SAVED_SEARCHES) {
      throw AppException.badRequest(
        ErrorCode.SavedSearchLimitReached,
        `You can keep up to ${MAX_SAVED_SEARCHES} saved searches`,
      );
    }
    return toSavedSearchResponse(await this.searches.create(userId, toData(input)));
  }

  async update(userId: string, id: string, input: SavedSearchInput): Promise<SavedSearchResponse> {
    await this.owned(userId, id);
    return toSavedSearchResponse(await this.searches.update(id, toData(input)));
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.owned(userId, id);
    await this.searches.delete(id);
  }

  private async owned(userId: string, id: string): Promise<SavedSearch> {
    const search = await this.searches.findById(id);
    if (!search || search.userId !== userId) throw AppException.notFound('Saved search');
    return search;
  }
}
