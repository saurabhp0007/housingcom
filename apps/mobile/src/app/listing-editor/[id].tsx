import {
  AMENITY_LABELS,
  Amenity,
  FurnishingType,
  GenderPreference,
  ListingType,
  SharingType,
} from '@housingcom/contracts';
import {
  AppText,
  Button,
  Card,
  Chip,
  DateField,
  HStack,
  Loader,
  Pill,
  Screen,
  TextField,
  Toggle,
  VStack,
  useTheme,
  useToast,
} from '@housingcom/ui';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSession } from '@/features/auth/hooks/useSession';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { LocationPicker } from '@/features/listings/components/LocationPicker';
import { PhotoManager } from '@/features/listings/components/PhotoManager';
import {
  EDITOR_STEPS,
  FIELD_STEP,
  useListingForm,
  valuesFromListing,
  type EditorStep,
} from '@/features/listings/hooks/useListingForm';
import {
  FURNISHING_LABELS,
  GENDER_LABELS,
  SHARING_LABELS,
  STATUS_META,
  TYPE_LABELS,
} from '@/features/listings/listing-labels';
import {
  useCreateListingMutation,
  useListingLifecycleMutation,
  useMyListingQuery,
  useUpdateListingMutation,
} from '@/features/listings/listings.api';
import { toAppError } from '@/shared/api/api-error';

const TYPES = Object.values(ListingType);
const SHARINGS = Object.values(SharingType);
const GENDERS = Object.values(GenderPreference);
const FURNISHINGS = Object.values(FurnishingType);
const AMENITIES = Object.values(Amenity);

/** Create / edit a listing in five steps. Each "Next" autosaves, so nothing is lost. */
export default function ListingEditorScreen() {
  const { id: param } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const { user } = useSession();
  const [listingId, setListingId] = useState<string | null>(param === 'new' ? null : param);
  const [step, setStep] = useState<EditorStep>(0);
  const { data: listing, isLoading } = useMyListingQuery(listingId ?? '', { skip: !listingId });
  const form = useListingForm(valuesFromListing());
  const hydrated = useRef(param === 'new');
  // Captured once per screen so the picker's minimum is stable across renders.
  const [today] = useState(() => new Date());

  const [createListing, createState] = useCreateListingMutation();
  const [updateListing, updateState] = useUpdateListingMutation();
  const [lifecycle, submitState] = useListingLifecycleMutation();
  const saving = createState.isLoading || updateState.isLoading;

  // Load an existing listing into the form once.
  useEffect(() => {
    if (!hydrated.current && listing) {
      hydrated.current = true;
      form.reset(valuesFromListing(listing));
    }
  }, [listing, form]);

  const v = form.values;
  const e = form.errors;
  const isVerified = !!user?.lister?.isVerified;
  const isLiveEdit = !!listing && (listing.status === 'live' || listing.status === 'paused');

  const next = async () => {
    if (step === 3) return setStep(4);
    const body = form.validate(step);
    if (!body) return;
    try {
      if (!listingId) {
        const created = await createListing({ ...body, type: v.type }).unwrap();
        setListingId(created.id);
        router.setParams({ id: created.id });
      } else {
        await updateListing({ id: listingId, body }).unwrap();
      }
      setStep((s) => (s + 1) as EditorStep);
    } catch (err) {
      toast.show(toAppError(err).message);
    }
  };

  const submit = async () => {
    if (!listingId) return;
    try {
      const result = await lifecycle({ id: listingId, action: 'submit' }).unwrap();
      toast.show(
        result.status === 'live' ? 'Your listing is live!' : 'Submitted. We’ll review it shortly.',
      );
      router.back();
    } catch (err) {
      const details = (err as { data?: { error?: { details?: { missing?: string[] } } } }).data
        ?.error?.details;
      const firstMissing = details?.missing?.map((f) => FIELD_STEP[f]).find((s) => s !== undefined);
      toast.show(toAppError(err).message);
      if (firstMissing !== undefined) setStep(firstMissing);
    }
  };

  const canSubmit = listing && (listing.status === 'draft' || listing.status === 'rejected');

  if (listingId && isLoading) {
    return (
      <Screen>
        <VStack flex={1} align="center" justify="center">
          <Loader />
        </VStack>
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{ title: param === 'new' && !listing ? 'New listing' : 'Edit listing' }}
      />
      <Screen
        scroll
        edges={['bottom']}
        footer={
          <HStack gap="sm">
            {step > 0 ? (
              <View style={{ flex: 1 }}>
                <Button
                  label="Back"
                  variant="outlined"
                  fullWidth
                  onPress={() => setStep((s) => (s - 1) as EditorStep)}
                />
              </View>
            ) : null}
            <View style={{ flex: 2 }}>
              {step < 4 ? (
                <Button
                  label={step === 3 ? 'Review' : 'Save & continue'}
                  loading={saving}
                  onPress={() => void next()}
                />
              ) : canSubmit ? (
                <Button
                  label={isVerified ? 'Publish now' : 'Submit for review'}
                  loading={submitState.isLoading}
                  onPress={() => void submit()}
                />
              ) : (
                <Button label="Done" onPress={() => router.back()} />
              )}
            </View>
          </HStack>
        }
      >
        <VStack gap="xl" style={{ paddingTop: spacing.md }}>
          {/* Step indicator */}
          <VStack gap="xs">
            <HStack gap="xxs">
              {EDITOR_STEPS.map((label, i) => (
                <View
                  key={label}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: i <= step ? colors.primary : colors.border,
                  }}
                />
              ))}
            </HStack>
            <AppText variant="caption" color="textSecondary">
              Step {step + 1} of {EDITOR_STEPS.length} · {EDITOR_STEPS[step]}
            </AppText>
          </VStack>

          {isLiveEdit && !isVerified ? (
            <Card tone="muted">
              <AppText variant="caption" color="textSecondary">
                Changes to a live listing are reviewed before they go live again. Get verified to
                publish instantly.
              </AppText>
            </Card>
          ) : null}

          {step === 0 ? (
            <VStack gap="lg">
              <VStack gap="sm">
                <AppText variant="label" color="textSecondary">
                  WHAT ARE YOU LISTING?
                </AppText>
                <HStack gap="sm" wrap>
                  {TYPES.map((t) => (
                    <Chip
                      key={t}
                      label={TYPE_LABELS[t]}
                      selected={v.type === t}
                      onPress={() => form.set('type', t)}
                    />
                  ))}
                </HStack>
              </VStack>
              <TextField
                label="Title"
                placeholder="e.g. Furnished single room near HSR BDA complex"
                value={v.title}
                onChangeText={(t) => form.set('title', t)}
                error={e.title}
                maxLength={100}
                autoCapitalize="sentences"
                returnKey="next"
              />
              <TextField
                label="Description"
                placeholder="Rooms, nearby places, who it suits, what’s included…"
                value={v.description}
                onChangeText={(t) => form.set('description', t)}
                error={e.description}
                helperText={`${v.description.trim().length}/2000`}
                maxLength={2000}
                multiline
              />
            </VStack>
          ) : null}

          {step === 1 ? (
            <VStack gap="lg">
              <LocationPicker
                value={v.location}
                onChange={(c) => form.set('location', c)}
                onAddress={(a) => {
                  if (!v.address.trim()) form.set('address', a);
                }}
              />
              {e.location ? <AppText color="danger">{e.location}</AppText> : null}
              <TextField
                label="Address"
                placeholder="House / building, street, landmark"
                value={v.address}
                onChangeText={(t) => form.set('address', t)}
                error={e.address}
                maxLength={300}
                autoCapitalize="words"
              />
            </VStack>
          ) : null}

          {step === 2 ? (
            <VStack gap="lg">
              <HStack gap="sm">
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Monthly rent"
                    prefix="₹"
                    keyboard="number"
                    value={v.rent}
                    onChangeText={(t) => form.set('rent', t.replace(/\D/g, ''))}
                    error={e.rent}
                    maxLength={7}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Deposit"
                    prefix="₹"
                    keyboard="number"
                    value={v.deposit}
                    onChangeText={(t) => form.set('deposit', t.replace(/\D/g, ''))}
                    error={e.deposit}
                    maxLength={7}
                  />
                </View>
              </HStack>

              <ChipGroup
                label={v.type === ListingType.Flat ? 'SHARING (OPTIONAL)' : 'SHARING'}
                options={SHARINGS}
                labels={SHARING_LABELS}
                selected={v.sharing}
                onSelect={(s) =>
                  form.set('sharing', v.sharing === s && v.type === ListingType.Flat ? null : s)
                }
                error={e.sharing}
              />
              <ChipGroup
                label="FOR"
                options={GENDERS}
                labels={GENDER_LABELS}
                selected={v.gender}
                onSelect={(g) => form.set('gender', g)}
              />
              <ChipGroup
                label="FURNISHING"
                options={FURNISHINGS}
                labels={FURNISHING_LABELS}
                selected={v.furnishing}
                onSelect={(f) => form.set('furnishing', f)}
              />

              <Toggle
                label="Food included"
                value={v.foodIncluded}
                onValueChange={(b) => form.set('foodIncluded', b)}
              />

              <DateField
                label="Available from"
                value={v.availableFrom}
                minimumDate={today}
                onChange={(d) => form.set('availableFrom', d)}
                error={e.availableFrom}
              />

              <VStack gap="sm">
                <AppText variant="label" color="textSecondary">
                  AMENITIES
                </AppText>
                <HStack gap="sm" wrap>
                  {AMENITIES.map((a) => {
                    const on = v.amenities.includes(a);
                    return (
                      <Chip
                        key={a}
                        label={AMENITY_LABELS[a]}
                        selected={on}
                        onPress={() =>
                          form.set(
                            'amenities',
                            on ? v.amenities.filter((x) => x !== a) : [...v.amenities, a],
                          )
                        }
                      />
                    );
                  })}
                </HStack>
              </VStack>

              <TextField
                label="House rules (optional)"
                placeholder="e.g. No smoking, guests allowed till 9 pm"
                value={v.houseRules}
                onChangeText={(t) => form.set('houseRules', t)}
                maxLength={1000}
                multiline
              />
            </VStack>
          ) : null}

          {step === 3 && listingId ? (
            <PhotoManager listingId={listingId} media={listing?.media ?? []} />
          ) : null}

          {step === 4 && listing ? (
            <VStack gap="lg">
              <HStack gap="sm" align="center">
                <AppText variant="heading">Preview</AppText>
                <Pill
                  label={STATUS_META[listing.status].label}
                  tone={STATUS_META[listing.status].tone}
                />
              </HStack>
              <ListingCard
                listing={listing}
                onPress={() => router.push(`/listing/${listing.id}`)}
              />
              {listing.rejectionReason ? (
                <Card tone="muted">
                  <VStack gap="xxs">
                    <AppText variant="bodyStrong" color="danger">
                      Changes requested
                    </AppText>
                    <AppText color="textSecondary">{listing.rejectionReason}</AppText>
                  </VStack>
                </Card>
              ) : null}
              <AppText color="textSecondary">
                {canSubmit
                  ? isVerified
                    ? 'You are a verified lister, so this goes live right away.'
                    : 'Our team reviews new listings, usually within a few hours. Verified listers go live instantly.'
                  : 'Your changes are saved.'}
              </AppText>
            </VStack>
          ) : null}
        </VStack>
      </Screen>
    </>
  );
}

function ChipGroup<T extends string>({
  label,
  options,
  labels,
  selected,
  onSelect,
  error,
}: {
  label: string;
  options: T[];
  labels: Record<T, string>;
  selected: T | null;
  onSelect: (value: T) => void;
  error?: string;
}) {
  return (
    <VStack gap="sm">
      <AppText variant="label" color="textSecondary">
        {label}
      </AppText>
      <HStack gap="sm" wrap>
        {options.map((o) => (
          <Chip key={o} label={labels[o]} selected={selected === o} onPress={() => onSelect(o)} />
        ))}
      </HStack>
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : null}
    </VStack>
  );
}
