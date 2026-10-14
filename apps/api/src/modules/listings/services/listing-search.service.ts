import { Inject, Injectable } from '@nestjs/common';
import type {
  ListingCardResponse,
  ListingFilters,
  MapResponse,
  Paginated,
} from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { RecommendationsService } from '../../recommendations/services/recommendations.service.js';
import type { MapQueryDto, SearchListingsQueryDto } from '../dto/search-query.dto.js';
import { LISTINGS_REPOSITORY, type ListingsRepository } from '../interfaces/listings-repository.interface.js';
import { ListingMapper } from '../mappers/listing.mapper.js';

const MAX_MAP_PINS = 200;
const SIMILAR_LIMIT = 10;

/** Search, map and similar listings, ranked with the recommendation engine's inputs. */
@Injectable()
export class ListingSearchService {
  constructor(
    @Inject(LISTINGS_REPOSITORY) private readonly listings: ListingsRepository,
    private readonly recommendations: RecommendationsService,
    private readonly mapper: ListingMapper,
  ) {}

  async search(q: SearchListingsQueryDto, viewerId?: string): Promise<Paginated<ListingCardResponse>> {
    const [weights, profile] = await Promise.all([
      this.recommendations.rankingWeights(),
      this.recommendations.profile(viewerId),
    ]);
    const filters = this.filters(q);
    const page = await this.listings.search({
      filters,
      point: q.lat !== undefined && q.lng !== undefined ? { lat: q.lat, lng: q.lng } : undefined,
      radiusKm: q.radiusKm,
      cityId: q.cityId,
      areaId: q.areaId,
      sort: q.sort,
      page: q.page,
      limit: q.limit,
      weights,
      affinity: { types: profile.types, areas: profile.areas },
      // An explicit budget filter beats the inferred one.
      budget: this.budgetFrom(filters) ?? profile.budget,
    });
    return { items: page.items.map((r) => this.mapper.card(r)), meta: page.meta };
  }

  map(q: MapQueryDto): Promise<MapResponse> {
    if (q.minLat >= q.maxLat || q.minLng >= q.maxLng) {
      throw AppException.badRequest('VALIDATION_FAILED', 'Invalid map bounds');
    }
    return this.listings.map({
      filters: this.filters(q),
      bbox: { minLat: q.minLat, minLng: q.minLng, maxLat: q.maxLat, maxLng: q.maxLng },
      maxPins: MAX_MAP_PINS,
    });
  }

  async similar(listingId: string): Promise<ListingCardResponse[]> {
    const listing = await this.listings.findById(listingId);
    if (!listing) throw AppException.notFound('Listing');
    return (await this.listings.similar(listing, SIMILAR_LIMIT)).map((r) => this.mapper.card(r));
  }

  private filters(q: ListingFilters): ListingFilters {
    return {
      types: q.types,
      minRent: q.minRent,
      maxRent: q.maxRent,
      sharing: q.sharing,
      genders: q.genders,
      furnishing: q.furnishing,
      foodIncluded: q.foodIncluded,
      amenities: q.amenities,
      availableBy: q.availableBy,
      q: q.q?.trim() || undefined,
    };
  }

  private budgetFrom(f: ListingFilters): number | null {
    if (f.minRent !== undefined && f.maxRent !== undefined) return Math.round((f.minRent + f.maxRent) / 2);
    if (f.maxRent !== undefined) return Math.round(f.maxRent * 0.85);
    if (f.minRent !== undefined) return Math.round(f.minRent * 1.15);
    return null;
  }
}
