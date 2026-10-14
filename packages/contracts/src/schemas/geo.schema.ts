import { z } from 'zod';

export const nearbyAreasQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.5).max(50).default(10),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type NearbyAreasQuery = z.infer<typeof nearbyAreasQuerySchema>;

export const resolveLocationQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});
export type ResolveLocationQuery = z.infer<typeof resolveLocationQuerySchema>;
