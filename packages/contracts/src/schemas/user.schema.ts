import { z } from 'zod';
import { ListerType } from '../enums/user.enums.js';

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  email: z.email().max(160).optional(),
  avatarUrl: z.url().max(512).optional(),
  preferredCityId: z.uuid().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const becomeListerSchema = z.object({
  listerType: z.enum([ListerType.Owner, ListerType.Dealer, ListerType.PgOperator]),
  businessName: z.string().trim().min(2).max(120).optional(),
});
export type BecomeListerInput = z.infer<typeof becomeListerSchema>;
