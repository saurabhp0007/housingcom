import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, type DeepPartial, type SelectQueryBuilder } from 'typeorm';
import {
  ListingSort,
  ListingStatus,
  MediaKind,
  type ListingFilters,
  type ListingType,
  type MapResponse,
  type Paginated,
} from '@housingcom/contracts';
import { buildPaginationMeta } from '../../../core/utils/pagination.util.js';
import {
  CONTACT_POPULARITY_MULTIPLIER,
  FRESHNESS_DECAY_DAYS,
  POPULARITY_SATURATION,
} from '../../recommendations/policies/ranking.policy.js';
import { ListingMedia } from '../entities/listing-media.entity.js';
import { ListingNearbyPlace } from '../entities/listing-nearby-place.entity.js';
import { Listing } from '../entities/listing.entity.js';
import type {
  ListingRow,
  ListingsRepository,
  MapParams,
  NearbyPlaceRow,
  SearchParams,
} from '../interfaces/listings-repository.interface.js';

const ORIGIN = 'ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography';
const SIMILAR_RADIUS_M = 8000;

interface RawExtras {
  area_name: string | null;
  city_name: string | null;
  is_verified_lister: boolean | null;
  cover_key: string | null;
  media_count: string | number | null;
  distance_m?: string | number | null;
}

@Injectable()
export class TypeOrmListingsRepository implements ListingsRepository {
  constructor(
    @InjectRepository(Listing) private readonly listings: Repository<Listing>,
    @InjectRepository(ListingNearbyPlace) private readonly nearby: Repository<ListingNearbyPlace>,
  ) {}

  create(data: DeepPartial<Listing>): Promise<Listing> {
    return this.listings.save(this.listings.create(data));
  }

  findById(id: string): Promise<Listing | null> {
    return this.listings.findOneBy({ id });
  }

  async findRow(id: string): Promise<ListingRow | null> {
    const rows = await this.toRows(this.baseQuery().where('listing.id = :id', { id }));
    return rows[0] ?? null;
  }

  async update(id: string, data: DeepPartial<Listing>): Promise<void> {
    await this.listings.update({ id }, data as never);
  }

  async softDelete(id: string): Promise<void> {
    await this.listings.softDelete({ id });
  }

  findByOwner(ownerId: string, status?: ListingStatus): Promise<ListingRow[]> {
    const qb = this.baseQuery()
      .where('listing.owner_id = :ownerId', { ownerId })
      .orderBy('listing.updated_at', 'DESC');
    if (status) qb.andWhere('listing.status = :status', { status });
    return this.toRows(qb);
  }

  async findByStatus(
    status: ListingStatus,
    page: number,
    limit: number,
  ): Promise<Paginated<ListingRow>> {
    const qb = this.baseQuery()
      .where('listing.status = :status', { status })
      // Oldest submissions first: a fair review queue.
      .orderBy('listing.submitted_at', 'ASC', 'NULLS LAST');
    const total = await qb.clone().getCount();
    const items = await this.toRows(qb.offset((page - 1) * limit).limit(limit));
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async incrementViews(id: string): Promise<void> {
    await this.listings.increment({ id }, 'viewCount', 1);
  }

  async countByStatus(): Promise<Partial<Record<ListingStatus, number>>> {
    const rows = await this.listings
      .createQueryBuilder('listing')
      .select('listing.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('listing.status')
      .getRawMany<{ status: ListingStatus; count: string }>();
    return Object.fromEntries(rows.map((r) => [r.status, Number(r.count)]));
  }

  async countByOwner(ownerIds: string[]): Promise<Map<string, number>> {
    if (ownerIds.length === 0) return new Map();
    const rows = await this.listings
      .createQueryBuilder('listing')
      .select('listing.owner_id', 'owner_id')
      .addSelect('COUNT(*)', 'count')
      .where({ ownerId: In(ownerIds) })
      .groupBy('listing.owner_id')
      .getRawMany<{ owner_id: string; count: string }>();
    return new Map(rows.map((r) => [r.owner_id, Number(r.count)]));
  }

  /**
   * Live listings matching filters, sorted by recommended score / nearest / newest / most viewed.
   * Recommended score (all signals 0..1, weights sum to 1):
   *   distance   1 − d/radius                        (location first)
   *   match      e^(−|rent − budget| / budget)       (fit with the user's budget)
   *   personal   type and area affinity from activity (learns from activity)
   *   popularity (views + 5·contacts) / (… + 50)     (saturating)
   *   freshness  e^(−age_days / 14)                  (new & updated listings boosted)
   */
  async search(p: SearchParams): Promise<Paginated<ListingRow>> {
    const qb = this.baseQuery().where('listing.status = :live', { live: ListingStatus.Live });
    this.applyFilters(qb, p.filters);
    if (p.cityId) qb.andWhere('listing.city_id = :cityId', { cityId: p.cityId });
    if (p.areaId) qb.andWhere('listing.area_id = :areaId', { areaId: p.areaId });

    if (p.point) {
      qb.addSelect(`ST_Distance(listing.location, ${ORIGIN})`, 'distance_m')
        .andWhere(`ST_DWithin(listing.location, ${ORIGIN}, :radiusM)`)
        .setParameters({ lat: p.point.lat, lng: p.point.lng, radiusM: p.radiusKm * 1000 });
    }

    switch (p.sort) {
      case ListingSort.Nearest:
        if (p.point) qb.orderBy('distance_m', 'ASC');
        else qb.orderBy('listing.published_at', 'DESC', 'NULLS LAST');
        break;
      case ListingSort.Newest:
        qb.orderBy('listing.published_at', 'DESC', 'NULLS LAST');
        break;
      case ListingSort.MostViewed:
        qb.orderBy('listing.view_count', 'DESC').addOrderBy(
          'listing.published_at',
          'DESC',
          'NULLS LAST',
        );
        break;
      case ListingSort.Recommended:
        qb.addSelect(this.scoreExpression(!!p.point, p.budget !== null), 'score')
          .setParameters({
            wD: p.weights.distance,
            wM: p.weights.match,
            wP: p.weights.personal,
            wPop: p.weights.popularity,
            wF: p.weights.freshness,
            budget: p.budget,
            typeAff: JSON.stringify(p.affinity.types),
            areaAff: JSON.stringify(p.affinity.areas),
          })
          .orderBy('score', 'DESC')
          .addOrderBy('listing.published_at', 'DESC', 'NULLS LAST');
        break;
    }

    const total = await qb.clone().getCount();
    const items = await this.toRows(qb.offset((p.page - 1) * p.limit).limit(p.limit));
    return { items, meta: buildPaginationMeta(p.page, p.limit, total) };
  }

  /** Pins for the visible region, or grid clusters when there are too many to draw. */
  async map({ filters, bbox, maxPins }: MapParams): Promise<MapResponse> {
    const envelope = 'ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)::geography';
    const base = () => {
      const qb = this.listings
        .createQueryBuilder('listing')
        .where('listing.status = :live', { live: ListingStatus.Live })
        .andWhere(`ST_Intersects(listing.location, ${envelope})`)
        .setParameters(bbox);
      this.applyFilters(qb, filters);
      return qb;
    };

    const total = await base().getCount();
    if (total <= maxPins) {
      const rows = await base()
        .leftJoin('lister_profiles', 'lp', 'lp.user_id = listing.owner_id')
        .select('listing.id', 'id')
        .addSelect('ST_Y(listing.location::geometry)', 'lat')
        .addSelect('ST_X(listing.location::geometry)', 'lng')
        .addSelect('listing.rent', 'rent')
        .addSelect('listing.type', 'type')
        .addSelect('COALESCE(lp.is_verified, false)', 'verified')
        .getRawMany<{
          id: string;
          lat: number;
          lng: number;
          rent: number;
          type: ListingType;
          verified: boolean;
        }>();
      return {
        total,
        clustered: false,
        features: rows.map((r) => ({
          kind: 'listing',
          id: r.id,
          location: { lat: Number(r.lat), lng: Number(r.lng) },
          rent: Number(r.rent),
          type: r.type,
          isVerifiedLister: !!r.verified,
        })),
      };
    }

    // ~6 cells across the larger side of the viewport: readable clusters on a phone screen.
    const cell = Math.max(bbox.maxLng - bbox.minLng, bbox.maxLat - bbox.minLat) / 6;
    const rows = await base()
      .select('COUNT(*)', 'count')
      .addSelect('MIN(listing.rent)', 'min_rent')
      .addSelect('ST_Y(ST_Centroid(ST_Collect(listing.location::geometry)))', 'lat')
      .addSelect('ST_X(ST_Centroid(ST_Collect(listing.location::geometry)))', 'lng')
      .addSelect('ST_AsText(ST_SnapToGrid(listing.location::geometry, :cell))', 'cell_key')
      .setParameter('cell', cell)
      .groupBy('ST_SnapToGrid(listing.location::geometry, :cell)')
      .getRawMany<{
        count: string;
        min_rent: number;
        lat: number;
        lng: number;
        cell_key: string;
      }>();
    return {
      total,
      clustered: true,
      features: rows.map((r) => ({
        kind: 'cluster',
        id: r.cell_key,
        location: { lat: Number(r.lat), lng: Number(r.lng) },
        count: Number(r.count),
        minRent: Number(r.min_rent),
      })),
    };
  }

  /** Same type, nearby, similar rent (PRD §3 "Similar listings nearby"). */
  async similar(listing: Listing, limit: number): Promise<ListingRow[]> {
    if (!listing.location || !listing.rent) return [];
    const [lng, lat] = listing.location.coordinates;
    const qb = this.baseQuery()
      .where('listing.status = :live', { live: ListingStatus.Live })
      .andWhere('listing.id <> :id', { id: listing.id })
      .andWhere('listing.type = :type', { type: listing.type })
      .addSelect(`ST_Distance(listing.location, ${ORIGIN})`, 'distance_m')
      .andWhere(`ST_DWithin(listing.location, ${ORIGIN}, :radiusM)`)
      .setParameters({ lat, lng, radiusM: SIMILAR_RADIUS_M, rent: listing.rent })
      .orderBy(
        `(ST_Distance(listing.location, ${ORIGIN}) / ${SIMILAR_RADIUS_M}) * 0.5 + LEAST(ABS(listing.rent - :rent)::float / :rent, 1) * 0.5`,
        'ASC',
      )
      .limit(limit);
    return this.toRows(qb);
  }

  async findNearbyPlaces(listingId: string): Promise<NearbyPlaceRow[]> {
    return this.nearby.find({ where: { listingId }, order: { distanceM: 'ASC' } });
  }

  async replaceNearbyPlaces(listingId: string, places: NearbyPlaceRow[]): Promise<void> {
    await this.nearby.manager.transaction(async (m) => {
      await m.delete(ListingNearbyPlace, { listingId });
      if (places.length)
        await m.insert(
          ListingNearbyPlace,
          places.map((p) => ({ ...p, listingId })),
        );
    });
  }

  private applyFilters(qb: SelectQueryBuilder<Listing>, f: ListingFilters): void {
    if (f.types?.length) qb.andWhere('listing.type IN (:...types)', { types: f.types });
    if (f.minRent !== undefined) qb.andWhere('listing.rent >= :minRent', { minRent: f.minRent });
    if (f.maxRent !== undefined) qb.andWhere('listing.rent <= :maxRent', { maxRent: f.maxRent });
    if (f.sharing?.length) qb.andWhere('listing.sharing IN (:...sharing)', { sharing: f.sharing });
    if (f.genders?.length) qb.andWhere('listing.gender IN (:...genders)', { genders: f.genders });
    if (f.furnishing?.length)
      qb.andWhere('listing.furnishing IN (:...furnishing)', { furnishing: f.furnishing });
    if (f.foodIncluded) qb.andWhere('listing.food_included = true');
    if (f.amenities?.length)
      qb.andWhere('listing.amenities @> ARRAY[:...amenities]::text[]', { amenities: f.amenities });
    if (f.availableBy)
      qb.andWhere('listing.available_from <= :availableBy', { availableBy: f.availableBy });
    if (f.q) qb.andWhere(`listing.search_vector @@ websearch_to_tsquery('simple', :q)`, { q: f.q });
  }

  private scoreExpression(hasPoint: boolean, hasBudget: boolean): string {
    const distance = hasPoint
      ? `GREATEST(0, 1 - ST_Distance(listing.location, ${ORIGIN}) / :radiusM)`
      : '0.5';
    const match = hasBudget ? 'EXP(-ABS(listing.rent - :budget)::float / :budget)' : '0.5';
    const personal =
      `(COALESCE((CAST(:typeAff AS jsonb) ->> listing.type)::float, 0) * 0.5 + ` +
      `COALESCE((CAST(:areaAff AS jsonb) ->> listing.area_id::text)::float, 0) * 0.5)`;
    const engagement = `(listing.view_count + ${CONTACT_POPULARITY_MULTIPLIER} * listing.contact_count)::float`;
    const popularity = `(${engagement} / (${engagement} + ${POPULARITY_SATURATION}))`;
    const freshness = `EXP(-EXTRACT(EPOCH FROM (now() - COALESCE(listing.published_at, listing.created_at))) / 86400.0 / ${FRESHNESS_DECAY_DAYS})`;
    return `(:wD * ${distance} + :wM * ${match} + :wP * ${personal} + :wPop * ${popularity} + :wF * ${freshness})`;
  }

  /** Card data in one query: area/city names, verified badge, cover photo and media count. */
  private baseQuery(): SelectQueryBuilder<Listing> {
    return this.listings
      .createQueryBuilder('listing')
      .leftJoin('listing.area', 'area')
      .leftJoin('listing.city', 'city')
      .leftJoin('lister_profiles', 'lp', 'lp.user_id = listing.owner_id')
      .addSelect('area.name', 'area_name')
      .addSelect('city.name', 'city_name')
      .addSelect('lp.is_verified', 'is_verified_lister')
      .addSelect(
        (sub) =>
          sub
            .select('m.thumbnail_key')
            .from(ListingMedia, 'm')
            .where('m.listing_id = listing.id')
            .andWhere('m.kind = :imageKind', { imageKind: MediaKind.Image })
            .orderBy('m.position', 'ASC')
            .limit(1),
        'cover_key',
      )
      .addSelect(
        (sub) =>
          sub.select('COUNT(*)').from(ListingMedia, 'mc').where('mc.listing_id = listing.id'),
        'media_count',
      );
  }

  private async toRows(qb: SelectQueryBuilder<Listing>): Promise<ListingRow[]> {
    const { entities, raw } = await qb.getRawAndEntities<RawExtras>();
    return entities.map((listing, i) => {
      const r = raw[i]!;
      return {
        listing,
        areaName: r.area_name,
        cityName: r.city_name,
        isVerifiedLister: !!r.is_verified_lister,
        coverKey: r.cover_key,
        mediaCount: Number(r.media_count ?? 0),
        ...(r.distance_m != null ? { distanceKm: Number(r.distance_m) / 1000 } : {}),
      };
    });
  }
}
