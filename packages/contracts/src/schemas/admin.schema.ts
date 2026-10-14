import { z } from 'zod';
import { UserRole, UserStatus } from '../enums/user.enums.js';
import { VerificationStatus } from '../enums/verification.enums.js';
import { ListingStatus } from '../enums/listing.enums.js';

const values = <T extends Record<string, string>>(o: T) => Object.values(o) as [T[keyof T], ...T[keyof T][]];

export const adminListingsQuerySchema = z.object({
  status: z.enum(values(ListingStatus)).default(ListingStatus.PendingApproval),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminVerificationsQuerySchema = z.object({
  status: z.enum(values(VerificationStatus)).default(VerificationStatus.Pending),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminUsersQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  role: z.enum(values(UserRole)).optional(),
  status: z.enum(values(UserStatus)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const upsertCitySchema = z.object({
  name: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  isActive: z.boolean().optional(),
});
export type UpsertCityInput = z.infer<typeof upsertCitySchema>;

export const upsertAreaSchema = z.object({
  name: z.string().trim().min(2).max(100),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export type UpsertAreaInput = z.infer<typeof upsertAreaSchema>;
