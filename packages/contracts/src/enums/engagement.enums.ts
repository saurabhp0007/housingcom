export const ContactChannel = {
  Call: 'call',
  WhatsApp: 'whatsapp',
  Chat: 'chat',
} as const;
export type ContactChannel = (typeof ContactChannel)[keyof typeof ContactChannel];

export const VisitSlot = {
  Morning: 'morning',
  Afternoon: 'afternoon',
  Evening: 'evening',
} as const;
export type VisitSlot = (typeof VisitSlot)[keyof typeof VisitSlot];

export const VISIT_SLOT_LABELS: Record<VisitSlot, string> = {
  morning: 'Morning (9–12)',
  afternoon: 'Afternoon (12–4)',
  evening: 'Evening (4–8)',
};

export const VisitStatus = {
  Requested: 'requested',
  Confirmed: 'confirmed',
  Declined: 'declined',
  Cancelled: 'cancelled',
} as const;
export type VisitStatus = (typeof VisitStatus)[keyof typeof VisitStatus];

export const ReportReason = {
  Fake: 'fake',
  WrongInfo: 'wrong_info',
  AlreadyRented: 'already_rented',
  Scam: 'scam',
  Offensive: 'offensive',
  Other: 'other',
} as const;
export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  fake: 'Fake listing',
  wrong_info: 'Wrong details or photos',
  already_rented: 'Already rented',
  scam: 'Asked for money upfront / scam',
  offensive: 'Offensive content',
  other: 'Something else',
};

export const ReportStatus = {
  Open: 'open',
  Dismissed: 'dismissed',
  Actioned: 'actioned',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const NotificationType = {
  ListingApproved: 'listing_approved',
  ListingRejected: 'listing_rejected',
  ListingRemoved: 'listing_removed',
  ListerVerified: 'lister_verified',
  VerificationRejected: 'verification_rejected',
  NewLead: 'new_lead',
  VisitRequested: 'visit_requested',
  VisitUpdated: 'visit_updated',
  NewMessage: 'new_message',
  SavedSearchMatch: 'saved_search_match',
  Announcement: 'announcement',
  PaymentReceived: 'payment_received',
  FeaturedExpiring: 'featured_expiring',
  FeaturedEnded: 'featured_ended',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
