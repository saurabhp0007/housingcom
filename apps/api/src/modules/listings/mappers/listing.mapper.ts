import { Injectable } from '@nestjs/common';
import type {
  ListingCardResponse,
  ListingDetailResponse,
  ListingMediaResponse,
  MyListingResponse,
} from '@housingcom/contracts';
import { PublicUrlService } from '../../../core/media/public-url.service.js';
import { fromPoint } from '../../../core/utils/geo.util.js';
import type { User } from '../../users/entities/user.entity.js';
import type { ListingMedia } from '../entities/listing-media.entity.js';
import type { ListingRow, NearbyPlaceRow } from '../interfaces/listings-repository.interface.js';

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Entity → response contracts. Injectable because media URLs depend on storage config. */
@Injectable()
export class ListingMapper {
  constructor(private readonly urls: PublicUrlService) {}

  card({
    listing: l,
    areaName,
    cityName,
    isVerifiedLister,
    coverKey,
    distanceKm,
  }: ListingRow): ListingCardResponse {
    return {
      id: l.id,
      type: l.type,
      title: l.title ?? 'Untitled listing',
      rent: l.rent ?? 0,
      deposit: l.deposit,
      sharing: l.sharing,
      gender: l.gender,
      furnishing: l.furnishing,
      foodIncluded: l.foodIncluded,
      areaName,
      cityName,
      location: l.location ? fromPoint(l.location) : null,
      coverUrl: this.urls.url(coverKey),
      isVerifiedLister,
      publishedAt: l.publishedAt?.toISOString() ?? null,
      ...(distanceKm !== undefined ? { distanceKm: round2(distanceKm) } : {}),
    };
  }

  mine(row: ListingRow): MyListingResponse {
    const l = row.listing;
    return {
      ...this.card(row),
      status: l.status,
      rejectionReason: l.rejectionReason,
      viewCount: l.viewCount,
      contactCount: l.contactCount,
      mediaCount: row.mediaCount,
      updatedAt: l.updatedAt.toISOString(),
    };
  }

  media(m: ListingMedia): ListingMediaResponse {
    return {
      id: m.id,
      kind: m.kind,
      url: this.urls.url(m.storageKey),
      thumbnailUrl: this.urls.url(m.thumbnailKey),
      width: m.width,
      height: m.height,
      position: m.position,
    };
  }

  /** `privileged`: the owner or an admin, who also see moderation fields and stats. */
  detail(
    row: ListingRow,
    media: ListingMedia[],
    owner: User,
    nearby: NearbyPlaceRow[],
    privileged: boolean,
  ): ListingDetailResponse {
    const l = row.listing;
    return {
      ...this.card(row),
      description: l.description,
      amenities: l.amenities,
      houseRules: l.houseRules,
      availableFrom: l.availableFrom,
      address: l.address,
      areaId: l.areaId,
      cityId: l.cityId,
      media: media.map((m) => this.media(m)),
      nearbyPlaces: nearby.map((p) => ({ category: p.category, name: p.name, distanceKm: round2(p.distanceM / 1000) })),
      owner: {
        id: owner.id,
        name: owner.fullName,
        isVerified: owner.listerProfile?.isVerified ?? false,
        memberSince: owner.createdAt.toISOString(),
      },
      status: l.status,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
      ...(privileged
        ? {
            rejectionReason: l.rejectionReason,
            viewCount: l.viewCount,
            contactCount: l.contactCount,
          }
        : {}),
    };
  }
}
