import { z } from 'zod';
import { FeatureStatus, PaymentStatus } from '../enums/monetization.enums.js';

const values = <T extends Record<string, string>>(o: T) =>
  Object.values(o) as [T[keyof T], ...T[keyof T][]];

/** Admin: a featured plan. Scope: everywhere (no city/area), one city, or one area. */
export const featuredPlanSchema = z.object({
  name: z.string().trim().min(2).max(60),
  durationDays: z.number().int().min(1).max(90),
  priceInr: z.number().int().min(1).max(100_000),
  cityId: z.uuid().nullable().optional(),
  areaId: z.uuid().nullable().optional(),
  /** Most featured listings allowed at once in one area (null = unlimited). */
  maxSlotsPerArea: z.number().int().min(1).max(500).nullable().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});
export type FeaturedPlanInput = z.infer<typeof featuredPlanSchema>;

export const featureCheckoutSchema = z.object({ planId: z.uuid() });
export type FeatureCheckoutInput = z.infer<typeof featureCheckoutSchema>;

/** What Razorpay Checkout returns to the app on success. */
export const verifyPaymentSchema = z.object({
  gatewayOrderId: z.string().min(1).max(64),
  gatewayPaymentId: z.string().min(1).max(64),
  signature: z.string().min(1).max(256),
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

/** Admin: feature a listing without payment ("manually pin a listing in an area"). */
export const pinListingSchema = z.object({
  durationDays: z.number().int().min(1).max(365),
  pinned: z.boolean(),
});
export type PinListingInput = z.infer<typeof pinListingSchema>;

export const adminFeaturesQuerySchema = z.object({
  status: z.enum(values(FeatureStatus)).default(FeatureStatus.Active),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminPaymentsQuerySchema = z.object({
  status: z.enum(values(PaymentStatus)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
