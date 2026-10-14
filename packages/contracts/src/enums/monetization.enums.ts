export const FeatureStatus = {
  Active: 'active',
  /** Hidden by an admin; the remaining time is kept and resumes later. */
  Paused: 'paused',
  Expired: 'expired',
  /** Taken off by an admin. */
  Removed: 'removed',
} as const;
export type FeatureStatus = (typeof FeatureStatus)[keyof typeof FeatureStatus];

export const FeatureSource = {
  Purchase: 'purchase',
  /** Pinned by an admin, no payment. */
  Admin: 'admin',
} as const;
export type FeatureSource = (typeof FeatureSource)[keyof typeof FeatureSource];

export const PaymentStatus = {
  Created: 'created',
  Paid: 'paid',
  Failed: 'failed',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentPurpose = {
  FeatureListing: 'feature_listing',
} as const;
export type PaymentPurpose = (typeof PaymentPurpose)[keyof typeof PaymentPurpose];

/** `fake` exists for development and tests only; production refuses to boot with it. */
export const PaymentDriver = {
  Razorpay: 'razorpay',
  Fake: 'fake',
} as const;
export type PaymentDriver = (typeof PaymentDriver)[keyof typeof PaymentDriver];

/** What the app sends to "pay" against the fake driver (development and tests only). */
export const FAKE_CHECKOUT = { paymentIdPrefix: 'pay_fake_', signature: 'fake_signature' } as const;

/** Durations offered in the plan editor (PRD: "for example 7, 15 or 30 days"). */
export const FEATURE_DURATION_PRESETS = [7, 15, 30] as const;
