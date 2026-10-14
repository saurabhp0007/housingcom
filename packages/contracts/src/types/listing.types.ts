import type {
  Amenity,
  FurnishingType,
  GenderPreference,
  ListingStatus,
  ListingType,
  MediaKind,
  SharingType,
} from '../enums/listing.enums.js';
import type { Coordinates } from '../schemas/common.schema.js';

export interface ListingMediaResponse {
  id: string;
  kind: MediaKind;
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  position: number;
}

/** Compact shape for lists, cards and map pins. */
export interface ListingCardResponse {
  id: string;
  type: ListingType;
  title: string;
  rent: number;
  deposit: number | null;
  sharing: SharingType | null;
  gender: GenderPreference | null;
  furnishing: FurnishingType | null;
  foodIncluded: boolean;
  areaName: string | null;
  cityName: string | null;
  location: Coordinates | null;
  coverUrl: string | null;
  isVerifiedLister: boolean;
  publishedAt: string | null;
  /** Present when browsing by location. */
  distanceKm?: number;
}

export interface ListingOwnerSummary {
  id: string;
  name: string | null;
  isVerified: boolean;
  memberSince: string;
}

export interface ListingDetailResponse extends ListingCardResponse {
  description: string | null;
  amenities: Amenity[];
  houseRules: string | null;
  availableFrom: string | null;
  address: string | null;
  areaId: string | null;
  cityId: string | null;
  media: ListingMediaResponse[];
  owner: ListingOwnerSummary;
  status: ListingStatus;
  /** Owner / admin only. */
  rejectionReason?: string | null;
  viewCount?: number;
  contactCount?: number;
  createdAt: string;
  updatedAt: string;
}

/** A lister's own listing in "My listings". */
export interface MyListingResponse extends ListingCardResponse {
  status: ListingStatus;
  rejectionReason: string | null;
  viewCount: number;
  contactCount: number;
  mediaCount: number;
  updatedAt: string;
}
