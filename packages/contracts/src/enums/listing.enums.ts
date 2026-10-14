export const ListingType = {
  Room: 'room',
  Flat: 'flat',
  Pg: 'pg',
} as const;
export type ListingType = (typeof ListingType)[keyof typeof ListingType];

export const SharingType = {
  Single: 'single',
  Double: 'double',
  Triple: 'triple',
} as const;
export type SharingType = (typeof SharingType)[keyof typeof SharingType];

export const GenderPreference = {
  Boys: 'boys',
  Girls: 'girls',
  CoLiving: 'co_living',
} as const;
export type GenderPreference = (typeof GenderPreference)[keyof typeof GenderPreference];

export const ListingStatus = {
  Draft: 'draft',
  PendingApproval: 'pending_approval',
  Live: 'live',
  Rejected: 'rejected',
  Paused: 'paused',
  Filled: 'filled',
} as const;
export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];
