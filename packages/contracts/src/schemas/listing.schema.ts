import { z } from 'zod';
import {
  Amenity,
  FurnishingType,
  GenderPreference,
  ListingSort,
  ListingStatus,
  ListingType,
  SharingType,
} from '../enums/listing.enums.js';
import { coordinatesSchema } from './common.schema.js';

const values = <T extends Record<string, string>>(o: T) => Object.values(o) as [T[keyof T], ...T[keyof T][]];

/**
 * Fields of a listing. Every field is optional while drafting (the editor autosaves);
 * completeness is enforced when the listing is submitted (see `listingSubmitSchema`).
 */
export const listingFieldsSchema = z.object({
  type: z.enum(values(ListingType)),
  title: z.string().trim().min(10).max(100),
  description: z.string().trim().min(30).max(2000),
  rent: z.number().int().min(500).max(1_000_000),
  deposit: z.number().int().min(0).max(5_000_000),
  sharing: z.enum(values(SharingType)).nullable(),
  gender: z.enum(values(GenderPreference)),
  furnishing: z.enum(values(FurnishingType)),
  foodIncluded: z.boolean(),
  amenities: z.array(z.enum(values(Amenity))).max(30),
  houseRules: z.string().trim().max(1000).nullable(),
  /** ISO date (YYYY-MM-DD). */
  availableFrom: z.iso.date(),
  address: z.string().trim().min(5).max(300),
  location: coordinatesSchema,
});
export type ListingFields = z.infer<typeof listingFieldsSchema>;

export const createListingSchema = listingFieldsSchema.partial().required({ type: true });
export type CreateListingInput = z.infer<typeof createListingSchema>;

export const updateListingSchema = listingFieldsSchema.partial();
export type UpdateListingInput = z.infer<typeof updateListingSchema>;

/** What a listing must have before it can go to review / live. */
export const listingSubmitSchema = listingFieldsSchema.superRefine((l, ctx) => {
  if ((l.type === ListingType.Room || l.type === ListingType.Pg) && !l.sharing) {
    ctx.addIssue({ code: 'custom', path: ['sharing'], message: 'Choose a sharing type' });
  }
});

export const browseListingsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0.5).max(50).default(10),
  cityId: z.uuid().optional(),
  areaId: z.uuid().optional(),
  type: z.enum(values(ListingType)).optional(),
  sort: z.enum(values(ListingSort)).default(ListingSort.Newest),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type BrowseListingsQuery = z.infer<typeof browseListingsQuerySchema>;

export const rejectSchema = z.object({ reason: z.string().trim().min(5).max(500) });
export type RejectInput = z.infer<typeof rejectSchema>;

export const myListingsQuerySchema = z.object({
  status: z.enum(values(ListingStatus)).optional(),
});
