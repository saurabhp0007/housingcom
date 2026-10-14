import type {
  FeatureSource,
  FeatureStatus,
  PaymentDriver,
  PaymentStatus,
} from '../enums/monetization.enums.js';
import type { ListingCardResponse } from './listing.types.js';

export interface FeaturedPlanResponse {
  id: string;
  name: string;
  durationDays: number;
  priceInr: number;
  cityId: string | null;
  cityName: string | null;
  areaId: string | null;
  areaName: string | null;
  maxSlotsPerArea: number | null;
  isActive: boolean;
  sortOrder: number;
}

/** A listing's featured period with its performance (PRD: impressions, views and leads). */
export interface ListingFeatureResponse {
  id: string;
  listing: ListingCardResponse;
  status: FeatureStatus;
  source: FeatureSource;
  pinned: boolean;
  startsAt: string;
  endsAt: string;
  impressions: number;
  views: number;
  leads: number;
  planName: string | null;
}

/** Everything the "Feature this listing" screen needs. */
export interface FeatureOptionsResponse {
  listingId: string;
  plans: FeaturedPlanResponse[];
  /** Featured slots in the listing's area (null limit = unlimited). */
  slots: { limit: number | null; used: number; available: boolean };
  current: ListingFeatureResponse | null;
}

/** Opens the payment sheet. With driver "fake" (dev only) the app simulates the payment. */
export interface CheckoutResponse {
  paymentId: string;
  driver: PaymentDriver;
  keyId: string;
  gatewayOrderId: string;
  amountPaise: number;
  currency: 'INR';
  businessName: string;
  description: string;
  prefill: { name: string | null; email: string | null; contact: string | null };
}

export interface PaymentResponse {
  id: string;
  status: PaymentStatus;
  amountInr: number;
  description: string;
  listingId: string | null;
  gatewayOrderId: string;
  gatewayPaymentId: string | null;
  failureReason: string | null;
  createdAt: string;
  paidAt: string | null;
  /** Admin views only. */
  user?: { id: string; name: string | null; phone: string | null };
}

export interface RevenueSummary {
  activeFeatured: number;
  revenueLast30DaysInr: number;
  revenueTotalInr: number;
}
