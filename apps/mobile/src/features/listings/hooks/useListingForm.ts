import {
  ListingType,
  listingFieldsSchema,
  type Amenity,
  type Coordinates,
  type FurnishingType,
  type GenderPreference,
  type ListingDetailResponse,
  type SharingType,
  type UpdateListingInput,
} from '@housingcom/contracts';
import { useCallback, useState } from 'react';

export const EDITOR_STEPS = ['Basics', 'Location', 'Details', 'Photos', 'Review'] as const;
export type EditorStep = 0 | 1 | 2 | 3 | 4;

export interface ListingFormValues {
  type: ListingType;
  title: string;
  description: string;
  address: string;
  location: Coordinates | null;
  rent: string;
  deposit: string;
  sharing: SharingType | null;
  gender: GenderPreference;
  furnishing: FurnishingType;
  foodIncluded: boolean;
  amenities: Amenity[];
  houseRules: string;
  availableFrom: Date;
}

export type FormErrors = Partial<Record<keyof ListingFormValues, string>>;

const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromIsoDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
};
const digits = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(/[^\d]/g, '')));

/** Maps API field paths (from LISTING_INCOMPLETE) to the step that edits them. */
export const FIELD_STEP: Record<string, EditorStep> = {
  type: 0,
  title: 0,
  description: 0,
  address: 1,
  location: 1,
  rent: 2,
  deposit: 2,
  sharing: 2,
  gender: 2,
  furnishing: 2,
  foodIncluded: 2,
  amenities: 2,
  houseRules: 2,
  availableFrom: 2,
  photos: 3,
};

export function valuesFromListing(l?: ListingDetailResponse): ListingFormValues {
  return {
    type: l?.type ?? ListingType.Room,
    title: l?.title === 'Untitled listing' ? '' : (l?.title ?? ''),
    description: l?.description ?? '',
    address: l?.address ?? '',
    location: l?.location ?? null,
    rent: l?.rent ? String(l.rent) : '',
    deposit: l?.deposit != null ? String(l.deposit) : '',
    sharing: l?.sharing ?? null,
    gender: l?.gender ?? 'co_living',
    furnishing: l?.furnishing ?? 'furnished',
    foodIncluded: l?.foodIncluded ?? false,
    amenities: l?.amenities ?? [],
    houseRules: l?.houseRules ?? '',
    availableFrom: l?.availableFrom ? fromIsoDate(l.availableFrom) : new Date(),
  };
}

/** Each step validates its own fields with the shared contract schema and returns the PATCH body. */
function stepPayload(
  step: EditorStep,
  v: ListingFormValues,
): { body?: UpdateListingInput; errors: FormErrors } {
  const s = listingFieldsSchema;
  const pick = (() => {
    switch (step) {
      case 0:
        return {
          schema: s.pick({ type: true, title: true, description: true }),
          body: { type: v.type, title: v.title.trim(), description: v.description.trim() },
        };
      case 1:
        return {
          schema: s.pick({ address: true, location: true }),
          body: { address: v.address.trim(), location: v.location ?? undefined },
        };
      case 2:
        return {
          schema: s.pick({
            rent: true,
            deposit: true,
            sharing: true,
            gender: true,
            furnishing: true,
            foodIncluded: true,
            amenities: true,
            houseRules: true,
            availableFrom: true,
          }),
          body: {
            rent: digits(v.rent),
            deposit: digits(v.deposit) ?? 0,
            sharing: v.sharing,
            gender: v.gender,
            furnishing: v.furnishing,
            foodIncluded: v.foodIncluded,
            amenities: v.amenities,
            houseRules: v.houseRules.trim() || null,
            availableFrom: toIsoDate(v.availableFrom),
          },
        };
      default:
        return null;
    }
  })();
  if (!pick) return { errors: {} };

  const parsed = pick.schema.safeParse(pick.body);
  const errors: FormErrors = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof ListingFormValues;
      errors[field] ??= friendly(field, issue.message);
    }
  }
  if (step === 2 && v.type !== ListingType.Flat && !v.sharing)
    errors.sharing = 'Choose a sharing type';
  return Object.keys(errors).length
    ? { errors }
    : { body: pick.body as UpdateListingInput, errors };
}

function friendly(field: keyof ListingFormValues, fallback: string): string {
  const copy: Partial<Record<keyof ListingFormValues, string>> = {
    title: 'Use 10–100 characters, e.g. "Furnished single room near HSR BDA"',
    description: 'Describe the place in at least 30 characters',
    address: 'Enter the street address (at least 5 characters)',
    location: 'Place the pin on the map',
    rent: 'Enter monthly rent between ₹500 and ₹10,00,000',
    deposit: 'Enter the deposit (0 if none)',
  };
  return copy[field] ?? fallback;
}

export function useListingForm(initial: ListingFormValues) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FormErrors>({});

  const set = useCallback(
    <K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) => {
      setValues((v) => ({ ...v, [key]: value }));
      setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
    },
    [],
  );

  const validate = useCallback(
    (step: EditorStep) => {
      const result = stepPayload(step, values);
      setErrors(result.errors);
      return result.body;
    },
    [values],
  );

  return { values, errors, set, validate, reset: setValues };
}
