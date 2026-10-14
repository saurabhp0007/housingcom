import {
  NotificationType,
  VISIT_SLOT_LABELS,
  VisitStatus,
  type VisitSlot,
} from '@housingcom/contracts';

/** What a user sees, and where tapping it goes in the app. */
export interface NotificationContent {
  type: NotificationType;
  title: string;
  body: string;
  url: string | null;
}

const quote = (title: string | null) => `"${title ?? 'Your listing'}"`;
const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** "Tue, 14 Mar" from an ISO timestamp, in India time. */
const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

/**
 * All notification copy in one place (pure, unit-tested). Routes are Expo Router paths
 * the app opens on tap.
 */
export const NotificationTemplates = {
  listingApproved: (listingId: string, title: string | null): NotificationContent => ({
    type: NotificationType.ListingApproved,
    title: 'Your listing is live',
    body: `${quote(title)} is now visible to people searching nearby.`,
    url: `/listing/${listingId}`,
  }),

  listingRejected: (
    listingId: string,
    title: string | null,
    reason?: string,
  ): NotificationContent => ({
    type: NotificationType.ListingRejected,
    title: 'Listing needs changes',
    body: `${quote(title)} wasn't approved${reason ? `: ${reason}` : '.'} Edit and resubmit.`,
    url: `/listing-editor/${listingId}`,
  }),

  listingRemoved: (
    listingId: string,
    title: string | null,
    reason?: string,
  ): NotificationContent => ({
    type: NotificationType.ListingRemoved,
    title: 'Listing taken down',
    body: `${quote(title)} was removed${reason ? `: ${reason}` : '.'} You can fix it and resubmit.`,
    url: `/listing-editor/${listingId}`,
  }),

  listerVerified: (): NotificationContent => ({
    type: NotificationType.ListerVerified,
    title: "You're verified",
    body: 'Your listings now show the verified badge and go live without review.',
    url: '/lister',
  }),

  verificationRejected: (reason?: string): NotificationContent => ({
    type: NotificationType.VerificationRejected,
    title: 'Verification not approved',
    body: reason
      ? `Reason: ${reason}. You can submit new documents.`
      : 'You can submit new documents.',
    url: '/lister/verification',
  }),

  newLead: (
    title: string | null,
    customerName: string | null,
    channel: string,
  ): NotificationContent => ({
    type: NotificationType.NewLead,
    title: 'New enquiry',
    body: `${customerName ?? 'Someone'} ${
      channel === 'visit' ? 'wants to visit' : 'is interested in'
    } ${quote(title)}.`,
    url: '/lister/leads',
  }),

  visitRequested: (
    title: string | null,
    customerName: string | null,
    date: string,
    slot: VisitSlot,
  ): NotificationContent => ({
    type: NotificationType.VisitRequested,
    title: 'Visit request',
    body: `${customerName ?? 'A tenant'} wants to see ${quote(title)} on ${formatDate(date)}, ${VISIT_SLOT_LABELS[slot]}.`,
    url: '/lister/leads',
  }),

  /** To the customer when the owner answers, or to the owner when the customer cancels. */
  visitUpdated: (
    status: VisitStatus,
    title: string | null,
    date: string,
    slot: VisitSlot,
  ): NotificationContent => {
    const when = `${formatDate(date)}, ${VISIT_SLOT_LABELS[slot]}`;
    switch (status) {
      case VisitStatus.Confirmed:
        return {
          type: NotificationType.VisitUpdated,
          title: 'Visit confirmed',
          body: `The owner confirmed your visit to ${quote(title)} on ${when}.`,
          url: '/visits',
        };
      case VisitStatus.Declined:
        return {
          type: NotificationType.VisitUpdated,
          title: 'Visit declined',
          body: `The owner can't do ${when} for ${quote(title)}. Try another time.`,
          url: '/visits',
        };
      default:
        return {
          type: NotificationType.VisitUpdated,
          title: 'Visit cancelled',
          body: `The visit to ${quote(title)} on ${when} was cancelled.`,
          url: '/lister/leads',
        };
    }
  },

  newMessage: (
    conversationId: string,
    senderName: string | null,
    body: string,
  ): NotificationContent => ({
    type: NotificationType.NewMessage,
    title: senderName ?? 'New message',
    body: truncate(body, 140),
    url: `/chat/${conversationId}`,
  }),

  savedSearchMatch: (
    listingId: string,
    label: string,
    title: string | null,
  ): NotificationContent => ({
    type: NotificationType.SavedSearchMatch,
    title: `New match: ${truncate(label, 40)}`,
    body: `${quote(title)} just went live.`,
    url: `/listing/${listingId}`,
  }),

  featuredActivated: (
    listingId: string,
    title: string | null,
    endsAt: string,
    renewed: boolean,
  ): NotificationContent => ({
    type: NotificationType.PaymentReceived,
    title: renewed ? 'Featured plan extended' : 'Your listing is featured',
    body: `${quote(title)} is featured until ${formatDay(endsAt)}. Track its views in Featured.`,
    url: '/lister/featured',
  }),

  featuredExpiring: (
    listingId: string,
    title: string | null,
    endsAt: string,
  ): NotificationContent => ({
    type: NotificationType.FeaturedExpiring,
    title: 'Featured plan ends soon',
    body: `${quote(title)} stops being featured on ${formatDay(endsAt)}. Renew to keep the top spot.`,
    url: `/lister/feature/${listingId}`,
  }),

  featuredEnded: (listingId: string, title: string | null): NotificationContent => ({
    type: NotificationType.FeaturedEnded,
    title: 'Featured plan ended',
    body: `${quote(title)} is back to normal ranking. Renew anytime.`,
    url: `/lister/feature/${listingId}`,
  }),

  announcement: (title: string, body: string): NotificationContent => ({
    type: NotificationType.Announcement,
    title,
    body,
    url: null,
  }),
};
