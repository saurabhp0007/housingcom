import { z } from 'zod';
import {
  Amenity,
  FurnishingType,
  GenderPreference,
  ListingEventType,
  ListingSort,
  ListingType,
  SharingType,
} from '../enums/listing.enums.js';

const values = <T extends Record<string, string>>(o: T) => Object.values(o) as [T[keyof T], ...T[keyof T][]];

/** Listing filters (PRD §3 "Filters"). Shared by search, map and recommendations. */
export const listingFiltersSchema = z.object({
  types: z.array(z.enum(values(ListingType))).optional(),
  minRent: z.number().int().min(0).optional(),
  maxRent: z.number().int().min(0).optional(),
  sharing: z.array(z.enum(values(SharingType))).optional(),
  genders: z.array(z.enum(values(GenderPreference))).optional(),
  furnishing: z.array(z.enum(values(FurnishingType))).optional(),
  foodIncluded: z.boolean().optional(),
  amenities: z.array(z.enum(values(Amenity))).optional(),
  /** Available on or before this date (YYYY-MM-DD). */
  availableBy: z.iso.date().optional(),
  /** Full-text keywords over title / description / address. */
  q: z.string().trim().max(80).optional(),
});
export type ListingFilters = z.infer<typeof listingFiltersSchema>;

export const searchListingsSchema = listingFiltersSchema.extend({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().min(0.5).max(50).default(10),
  cityId: z.uuid().optional(),
  areaId: z.uuid().optional(),
  sort: z.enum(values(ListingSort)).default(ListingSort.Recommended),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});
export type SearchListingsInput = z.infer<typeof searchListingsSchema>;

/** Visible map region. */
export const mapQuerySchema = listingFiltersSchema.extend({
  minLat: z.number().min(-90).max(90),
  minLng: z.number().min(-180).max(180),
  maxLat: z.number().min(-90).max(90),
  maxLng: z.number().min(-180).max(180),
});
export type MapQueryInput = z.infer<typeof mapQuerySchema>;

export const trackListingEventSchema = z.object({
  type: z.enum([ListingEventType.Share]),
});

export const placesAutocompleteSchema = z.object({
  q: z.string().trim().min(2).max(80),
  lat: z.number().optional(),
  lng: z.number().optional(),
  /** Groups autocomplete + details calls into one billed Google session. */
  sessionToken: z.string().max(64).optional(),
});

export const recommendationWeightsSchema = z.object({
  distance: z.number().min(0).max(1),
  match: z.number().min(0).max(1),
  personal: z.number().min(0).max(1),
  popularity: z.number().min(0).max(1),
  freshness: z.number().min(0).max(1),
});
export type RecommendationWeights = z.infer<typeof recommendationWeightsSchema>;
