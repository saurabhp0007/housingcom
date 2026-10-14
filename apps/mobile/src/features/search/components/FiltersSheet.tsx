import {
  AMENITY_LABELS,
  Amenity,
  FurnishingType,
  GenderPreference,
  ListingType,
  SharingType,
  type ListingFilters,
} from '@housingcom/contracts';
import {
  AppText,
  Button,
  Chip,
  DateField,
  HStack,
  Sheet,
  TextField,
  Toggle,
  VStack,
} from '@housingcom/ui';
import { useState } from 'react';
import { View } from 'react-native';
import {
  FURNISHING_LABELS,
  GENDER_LABELS,
  SHARING_LABELS,
  TYPE_LABELS,
} from '@/features/listings/listing-labels';

const BUDGETS: { label: string; min?: number; max?: number }[] = [
  { label: 'Under ₹5k', max: 5000 },
  { label: '₹5k–10k', min: 5000, max: 10000 },
  { label: '₹10k–15k', min: 10000, max: 15000 },
  { label: '₹15k–25k', min: 15000, max: 25000 },
  { label: '₹25k+', min: 25000 },
];

const toggleIn = <T,>(list: T[] | undefined, value: T): T[] | undefined => {
  const next = list?.includes(value) ? list.filter((v) => v !== value) : [...(list ?? []), value];
  return next.length ? next : undefined;
};

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

interface FiltersSheetProps {
  visible: boolean;
  value: ListingFilters;
  onApply: (filters: ListingFilters) => void;
  onDismiss: () => void;
}

/** All PRD filters in one native sheet. Edits a draft; nothing changes until "Show results". */
export function FiltersSheet({ visible, value, onApply, onDismiss }: FiltersSheetProps) {
  const [draft, setDraft] = useState<ListingFilters>(value);
  const [lastValue, setLastValue] = useState(value);
  // Re-sync the draft when the applied filters change from outside (React's "adjust state on prop change").
  if (lastValue !== value) {
    setLastValue(value);
    setDraft(value);
  }
  const set = (patch: Partial<ListingFilters>) => setDraft((d) => ({ ...d, ...patch }));
  const budgetSelected = (b: (typeof BUDGETS)[number]) =>
    draft.minRent === b.min && draft.maxRent === b.max;

  return (
    <Sheet visible={visible} onDismiss={onDismiss} title="Filters" snapPoints={['full']}>
      <VStack gap="lg">
        <Group label="LOOKING FOR">
          {Object.values(ListingType).map((t) => (
            <Chip
              key={t}
              label={TYPE_LABELS[t]}
              selected={!!draft.types?.includes(t)}
              onPress={() => set({ types: toggleIn(draft.types, t) })}
            />
          ))}
        </Group>

        <VStack gap="sm">
          <AppText variant="label" color="textSecondary">
            BUDGET PER MONTH
          </AppText>
          <HStack gap="sm" wrap>
            {BUDGETS.map((b) => (
              <Chip
                key={b.label}
                label={b.label}
                selected={budgetSelected(b)}
                onPress={() =>
                  set(
                    budgetSelected(b)
                      ? { minRent: undefined, maxRent: undefined }
                      : { minRent: b.min, maxRent: b.max },
                  )
                }
              />
            ))}
          </HStack>
          <HStack gap="sm">
            <View style={{ flex: 1 }}>
              <TextField
                label="Min"
                prefix="₹"
                keyboard="number"
                value={draft.minRent?.toString() ?? ''}
                onChangeText={(t) => set({ minRent: t ? Number(t.replace(/\D/g, '')) : undefined })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="Max"
                prefix="₹"
                keyboard="number"
                value={draft.maxRent?.toString() ?? ''}
                onChangeText={(t) => set({ maxRent: t ? Number(t.replace(/\D/g, '')) : undefined })}
              />
            </View>
          </HStack>
        </VStack>

        <Group label="SHARING">
          {Object.values(SharingType).map((s) => (
            <Chip
              key={s}
              label={SHARING_LABELS[s]}
              selected={!!draft.sharing?.includes(s)}
              onPress={() => set({ sharing: toggleIn(draft.sharing, s) })}
            />
          ))}
        </Group>

        <Group label="FOR">
          {Object.values(GenderPreference).map((g) => (
            <Chip
              key={g}
              label={GENDER_LABELS[g]}
              selected={!!draft.genders?.includes(g)}
              onPress={() => set({ genders: toggleIn(draft.genders, g) })}
            />
          ))}
        </Group>

        <Group label="FURNISHING">
          {Object.values(FurnishingType).map((f) => (
            <Chip
              key={f}
              label={FURNISHING_LABELS[f]}
              selected={!!draft.furnishing?.includes(f)}
              onPress={() => set({ furnishing: toggleIn(draft.furnishing, f) })}
            />
          ))}
        </Group>

        <Toggle
          label="Food included"
          value={!!draft.foodIncluded}
          onValueChange={(b) => set({ foodIncluded: b || undefined })}
        />

        <Group label="AMENITIES">
          {Object.values(Amenity).map((a) => (
            <Chip
              key={a}
              label={AMENITY_LABELS[a]}
              selected={!!draft.amenities?.includes(a)}
              onPress={() => set({ amenities: toggleIn(draft.amenities, a) })}
            />
          ))}
        </Group>

        <VStack gap="sm">
          <Toggle
            label="Must be available by a date"
            value={!!draft.availableBy}
            onValueChange={(on) => set({ availableBy: on ? isoDate(new Date()) : undefined })}
          />
          {draft.availableBy ? (
            <DateField
              label="Available by"
              value={new Date(`${draft.availableBy}T00:00:00`)}
              onChange={(d) => set({ availableBy: isoDate(d) })}
            />
          ) : null}
        </VStack>

        <HStack gap="sm">
          <View style={{ flex: 1 }}>
            <Button label="Clear all" variant="outlined" onPress={() => setDraft({})} />
          </View>
          <View style={{ flex: 2 }}>
            <Button label="Show results" onPress={() => onApply(draft)} />
          </View>
        </HStack>
      </VStack>
    </Sheet>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <VStack gap="sm">
      <AppText variant="label" color="textSecondary">
        {label}
      </AppText>
      <HStack gap="sm" wrap>
        {children}
      </HStack>
    </VStack>
  );
}
