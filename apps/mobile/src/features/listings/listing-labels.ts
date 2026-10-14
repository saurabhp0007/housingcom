import type { PillTone } from '@housingcom/ui';
import type {
  FurnishingType,
  GenderPreference,
  ListingStatus,
  ListingType,
  SharingType,
} from '@housingcom/contracts';

export const TYPE_LABELS: Record<ListingType, string> = { room: 'Room', flat: 'Flat', pg: 'PG' };
export const TYPE_LABELS_PLURAL: Record<ListingType, string> = {
  room: 'Rooms',
  flat: 'Flats',
  pg: 'PGs',
};
export const SHARING_LABELS: Record<SharingType, string> = {
  single: 'Single',
  double: 'Double',
  triple: 'Triple',
};
export const GENDER_LABELS: Record<GenderPreference, string> = {
  boys: 'Boys',
  girls: 'Girls',
  co_living: 'Co-living',
};
export const FURNISHING_LABELS: Record<FurnishingType, string> = {
  furnished: 'Furnished',
  semi_furnished: 'Semi-furnished',
  unfurnished: 'Unfurnished',
};

export const STATUS_META: Record<ListingStatus, { label: string; tone: PillTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  pending_approval: { label: 'In review', tone: 'warning' },
  live: { label: 'Live', tone: 'success' },
  rejected: { label: 'Needs changes', tone: 'danger' },
  paused: { label: 'Paused', tone: 'neutral' },
  filled: { label: 'Filled', tone: 'primary' },
  removed: { label: 'Taken down', tone: 'danger' },
};

/** "Single sharing · Co-living · Furnished" */
export function listingTagline(l: {
  type: ListingType;
  sharing: SharingType | null;
  gender: GenderPreference | null;
  furnishing: FurnishingType | null;
}): string {
  return [
    l.sharing ? `${SHARING_LABELS[l.sharing]} sharing` : TYPE_LABELS[l.type],
    l.gender ? GENDER_LABELS[l.gender] : null,
    l.furnishing ? FURNISHING_LABELS[l.furnishing] : null,
  ]
    .filter(Boolean)
    .join(' · ');
}
