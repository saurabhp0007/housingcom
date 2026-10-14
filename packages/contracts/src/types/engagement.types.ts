import type {
  ContactChannel,
  NotificationType,
  ReportReason,
  ReportStatus,
  VisitSlot,
  VisitStatus,
} from '../enums/engagement.enums.js';
import type { ListingFilters } from '../schemas/search.schema.js';
import type { Coordinates } from '../schemas/common.schema.js';
import type { ListingCardResponse } from './listing.types.js';

/** Returned when a signed-in user contacts an owner. Phone numbers are never public. */
export interface ContactOwnerResponse {
  channel: ContactChannel;
  /** E.164 owner phone for call / WhatsApp. */
  phone: string | null;
  /** For chat. */
  conversationId: string | null;
}

export interface PersonSummary {
  id: string;
  name: string | null;
  /** Only shared between the two parties of a lead. */
  phone: string | null;
}

export interface VisitResponse {
  id: string;
  listing: ListingCardResponse;
  customer: PersonSummary;
  date: string;
  slot: VisitSlot;
  note: string | null;
  status: VisitStatus;
  ownerNote: string | null;
  createdAt: string;
}

/** A lister's lead: someone who contacted them about a listing. */
export interface LeadResponse {
  id: string;
  listing: ListingCardResponse;
  customer: PersonSummary;
  channels: ContactChannel[];
  conversationId: string | null;
  lastContactAt: string;
  visits: VisitResponse[];
}

export interface ReviewResponse {
  id: string;
  rating: number;
  comment: string | null;
  author: { id: string; name: string | null };
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummaryResponse {
  average: number | null;
  count: number;
  /** Signed-in viewer's own review, and whether they may write one (must have contacted the owner). */
  mine: ReviewResponse | null;
  canReview: boolean;
  items: ReviewResponse[];
}

export interface ReportResponse {
  id: string;
  listing: ListingCardResponse;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reporter: { id: string; name: string | null };
  resolutionNote: string | null;
  createdAt: string;
  /** Open reports on the same listing (helps prioritise). */
  openReportsOnListing: number;
}

export interface ConversationResponse {
  id: string;
  listing: ListingCardResponse;
  /** The other participant. */
  counterpart: { id: string; name: string | null };
  /** Whether the viewer is the listing owner in this conversation. */
  iAmOwner: boolean;
  lastMessage: { body: string; senderId: string; createdAt: string } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface SavedSearchResponse {
  id: string;
  label: string;
  center: Coordinates;
  radiusKm: number;
  filters: ListingFilters;
  alertsEnabled: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** In-app route to open, e.g. "/listing/<id>". */
  url: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface BroadcastResponse {
  id: string;
  title: string;
  body: string;
  cityId: string | null;
  recipientCount: number;
  createdAt: string;
}

/** Socket.IO events on the /chat namespace (server → client). */
export const ChatSocketEvent = {
  Message: 'message',
  ConversationUpdated: 'conversation:updated',
} as const;
