export const VerificationStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const VerificationDocument = {
  Id: 'id',
  Property: 'property',
} as const;
export type VerificationDocument = (typeof VerificationDocument)[keyof typeof VerificationDocument];
