import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, type DeepPartial, type SelectQueryBuilder } from 'typeorm';
import { ListingSort, ListingStatus, MediaKind, type Paginated } from '@housingcom/contracts';
import { buildPaginationMeta } from '../../../core/utils/pagination.util.js';
import { ListingMedia } from '../entities/listing-media.entity.js';
import { Listing } from '../entities/listing.entity.js';
import type {
  BrowseFilter,
  ListingRow,
  ListingsRepository,
} from '../interfaces/listings-repository.interface.js';

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
  constructor(@InjectRepository(Listing) private readonly listings: Repository<Listing>) {}

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

  async browseLive(f: BrowseFilter): Promise<Paginated<ListingRow>> {
    const qb = this.baseQuery().where('listing.status = :live', { live: ListingStatus.Live });
    if (f.type) qb.andWhere('listing.type = :type', { type: f.type });
    if (f.cityId) qb.andWhere('listing.city_id = :cityId', { cityId: f.cityId });
    if (f.areaId) qb.andWhere('listing.area_id = :areaId', { areaId: f.areaId });

    if (f.point) {
      const origin = 'ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography';
      qb.addSelect(`ST_Distance(listing.location, ${origin})`, 'distance_m')
        .andWhere(`ST_DWithin(listing.location, ${origin}, :radiusM)`)
        .setParameters({ lat: f.point.lat, lng: f.point.lng, radiusM: f.radiusKm * 1000 });
    }

    if (f.sort === ListingSort.Nearest && f.point) qb.orderBy('distance_m', 'ASC');
    else qb.orderBy('listing.published_at', 'DESC', 'NULLS LAST');

    const total = await qb.clone().getCount();
    const items = await this.toRows(qb.offset((f.page - 1) * f.limit).limit(f.limit));
    return { items, meta: buildPaginationMeta(f.page, f.limit, total) };
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
