import { z } from 'zod';
import { ContactChannel, ReportReason, VisitSlot, VisitStatus } from '../enums/engagement.enums.js';
import { listingFiltersSchema } from './search.schema.js';

const values = <T extends Record<string, string>>(o: T) =>
  Object.values(o) as [T[keyof T], ...T[keyof T][]];

export const contactOwnerSchema = z.object({ channel: z.enum(values(ContactChannel)) });
export type ContactOwnerInput = z.infer<typeof contactOwnerSchema>;

export const requestVisitSchema = z.object({
  date: z.iso.date(),
  slot: z.enum(values(VisitSlot)),
  note: z.string().trim().max(300).optional(),
});
export type RequestVisitInput = z.infer<typeof requestVisitSchema>;

export const respondVisitSchema = z.object({
  status: z.enum([VisitStatus.Confirmed, VisitStatus.Declined]),
  note: z.string().trim().max(300).optional(),
});
export type RespondVisitInput = z.infer<typeof respondVisitSchema>;

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

export const reportListingSchema = z.object({
  reason: z.enum(values(ReportReason)),
  details: z.string().trim().max(500).optional(),
});
export type ReportListingInput = z.infer<typeof reportListingSchema>;

export const sendMessageSchema = z.object({ body: z.string().trim().min(1).max(2000) });
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const savedSearchSchema = z.object({
  label: z.string().trim().min(2).max(80),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusKm: z.number().min(0.5).max(50),
  filters: listingFiltersSchema,
  alertsEnabled: z.boolean(),
});
export type SavedSearchInput = z.infer<typeof savedSearchSchema>;

export const broadcastSchema = z.object({
  title: z.string().trim().min(3).max(80),
  body: z.string().trim().min(3).max(300),
  cityId: z.uuid().optional(),
});
export type BroadcastInput = z.infer<typeof broadcastSchema>;
