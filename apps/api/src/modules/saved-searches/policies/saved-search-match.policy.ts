import type {
  Amenity,
  FurnishingType,
  GenderPreference,
  ListingFilters,
  ListingType,
  SharingType,
} from '@housingcom/contracts';

/** The listing facts filters look at. */
export interface MatchableListing {
  type: ListingType;
  rent: number | null;
  sharing: SharingType | null;
  gender: GenderPreference | null;
  furnishing: FurnishingType | null;
  foodIncluded: boolean;
  amenities: Amenity[];
  availableFrom: string | null;
  text: string;
}

const inList = <T>(allowed: T[] | undefined, value: T | null) =>
  !allowed?.length || (value !== null && allowed.includes(value));

/**
 * Same semantics as the search query's filters (location is checked in SQL). Pure, so the
 * alert job and its tests agree with search without a database.
 */
export function matchesFilters(l: MatchableListing, f: ListingFilters): boolean {
  if (!inList(f.types, l.type)) return false;
  if (f.minRent !== undefined && (l.rent === null || l.rent < f.minRent)) return false;
  if (f.maxRent !== undefined && (l.rent === null || l.rent > f.maxRent)) return false;
  if (!inList(f.sharing, l.sharing)) return false;
  if (!inList(f.genders, l.gender)) return false;
  if (!inList(f.furnishing, l.furnishing)) return false;
  if (f.foodIncluded && !l.foodIncluded) return false;
  if (f.amenities?.some((a) => !l.amenities.includes(a))) return false;
  if (f.availableBy && l.availableFrom && l.availableFrom > f.availableBy) return false;
  if (f.q) {
    const text = l.text.toLowerCase();
    if (
      !f.q
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every((w) => text.includes(w))
    )
      return false;
  }
  return true;
}

/** Saved searches per user. */
export const MAX_SAVED_SEARCHES = 20;
