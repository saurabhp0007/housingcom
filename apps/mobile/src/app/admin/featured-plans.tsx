import {
  FEATURE_DURATION_PRESETS,
  type FeaturedPlanInput,
  type FeaturedPlanResponse,
} from '@housingcom/contracts';
import {
  AppText,
  Button,
  Card,
  Chip,
  EmptyState,
  HStack,
  Pill,
  Screen,
  Sheet,
  Skeleton,
  TextField,
  Toggle,
  VStack,
  useToast,
} from '@housingcom/ui';
import { formatInr } from '@housingcom/utils';
import { useState } from 'react';
import { Pressable } from 'react-native';
import {
  useAdminFeaturedPlansQuery,
  useCreateFeaturedPlanMutation,
  useUpdateFeaturedPlanMutation,
} from '@/features/featured/featured.api';
import { useCitiesQuery, useCityAreasQuery } from '@/features/location/geo.api';
import { toAppError } from '@/shared/api/api-error';

const scopeLabel = (p: FeaturedPlanResponse) =>
  p.areaName ? `${p.areaName}, ${p.cityName ?? ''}` : (p.cityName ?? 'All cities');

/**
 * Featured pricing (PRD §5): price and duration per city or area, plus a slot limit per area.
 * The most specific scope with active plans is what listers see.
 */
export default function FeaturedPlansScreen() {
  const { data, isLoading } = useAdminFeaturedPlansQuery();
  const [editing, setEditing] = useState<FeaturedPlanResponse | 'new' | null>(null);

  return (
    <Screen scroll edges={['bottom']}>
      <VStack gap="md" style={{ paddingVertical: 16 }}>
        <Button label="New plan" onPress={() => setEditing('new')} />
        {isLoading ? (
          <Skeleton height={90} radius="lg" />
        ) : data?.length ? (
          data.map((p) => (
            <Pressable key={p.id} accessibilityRole="button" onPress={() => setEditing(p)}>
              <Card tone={p.isActive ? 'surface' : 'muted'}>
                <VStack gap="xxs">
                  <HStack justify="space-between" align="center" gap="sm">
                    <AppText variant="bodyStrong" style={{ flex: 1 }}>
                      {p.name}
                    </AppText>
                    <AppText variant="heading">{formatInr(p.priceInr)}</AppText>
                  </HStack>
                  <HStack gap="xs" wrap align="center">
                    <Pill label={`${p.durationDays} days`} />
                    <Pill label={scopeLabel(p)} tone="primary" />
                    {p.maxSlotsPerArea ? (
                      <Pill label={`${p.maxSlotsPerArea} slots / area`} />
                    ) : null}
                    {!p.isActive ? <Pill label="Off" tone="neutral" /> : null}
                  </HStack>
                </VStack>
              </Card>
            </Pressable>
          ))
        ) : (
          <EmptyState
            title="No featured plans"
            description="Create plans so listers can pay to feature their listings."
          />
        )}
      </VStack>
      {editing ? (
        <PlanSheet plan={editing === 'new' ? null : editing} onDismiss={() => setEditing(null)} />
      ) : null}
    </Screen>
  );
}

/** Mounted per edit, so the form starts from the plan being edited. */
function PlanSheet({
  plan,
  onDismiss,
}: {
  plan: FeaturedPlanResponse | null;
  onDismiss: () => void;
}) {
  const toast = useToast();
  const { data: cities } = useCitiesQuery();
  const [name, setName] = useState(plan?.name ?? '');
  const [days, setDays] = useState(plan?.durationDays ?? 7);
  const [price, setPrice] = useState(plan ? String(plan.priceInr) : '');
  const [cityId, setCityId] = useState<string | null>(plan?.cityId ?? null);
  const [areaId, setAreaId] = useState<string | null>(plan?.areaId ?? null);
  const [slots, setSlots] = useState(plan?.maxSlotsPerArea ? String(plan.maxSlotsPerArea) : '');
  const [active, setActive] = useState(plan?.isActive ?? true);
  const { data: areas } = useCityAreasQuery({ cityId: cityId ?? '' }, { skip: !cityId });
  const [create, createState] = useCreateFeaturedPlanMutation();
  const [update, updateState] = useUpdateFeaturedPlanMutation();

  const priceInr = Number(price);
  const valid = name.trim().length >= 2 && Number.isInteger(priceInr) && priceInr >= 1;

  const save = async () => {
    const body: FeaturedPlanInput = {
      name: name.trim(),
      durationDays: days,
      priceInr,
      cityId,
      areaId: cityId ? areaId : null,
      maxSlotsPerArea: slots ? Number(slots) : null,
      isActive: active,
    };
    try {
      if (plan) await update({ id: plan.id, body }).unwrap();
      else await create(body).unwrap();
      onDismiss();
      toast.show({ message: 'Plan saved' });
    } catch (e) {
      toast.show({ message: toAppError(e).message });
    }
  };

  return (
    <Sheet
      visible
      onDismiss={onDismiss}
      title={plan ? 'Edit plan' : 'New plan'}
      snapPoints={['full']}
    >
      <VStack gap="md">
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          maxLength={60}
          placeholder="e.g. HSR · 15 days"
        />
        <VStack gap="xs">
          <AppText variant="label" color="textSecondary">
            DURATION
          </AppText>
          <HStack gap="xs" wrap>
            {FEATURE_DURATION_PRESETS.map((d) => (
              <Chip key={d} label={`${d} days`} selected={days === d} onPress={() => setDays(d)} />
            ))}
          </HStack>
        </VStack>
        <TextField
          label="Price"
          prefix="₹"
          keyboard="number"
          value={price}
          onChangeText={setPrice}
        />
        <VStack gap="xs">
          <AppText variant="label" color="textSecondary">
            CITY
          </AppText>
          <HStack gap="xs" wrap>
            <Chip
              label="All cities"
              selected={!cityId}
              onPress={() => {
                setCityId(null);
                setAreaId(null);
              }}
            />
            {cities?.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                selected={cityId === c.id}
                onPress={() => {
                  setCityId(c.id);
                  setAreaId(null);
                }}
              />
            ))}
          </HStack>
        </VStack>
        {cityId ? (
          <VStack gap="xs">
            <AppText variant="label" color="textSecondary">
              AREA (OPTIONAL)
            </AppText>
            <HStack gap="xs" wrap>
              <Chip label="Whole city" selected={!areaId} onPress={() => setAreaId(null)} />
              {areas?.map((a) => (
                <Chip
                  key={a.id}
                  label={a.name}
                  selected={areaId === a.id}
                  onPress={() => setAreaId(a.id)}
                />
              ))}
            </HStack>
          </VStack>
        ) : null}
        <TextField
          label="Featured slots per area (optional)"
          helperText="Most listings featured at once in one area. Empty = no limit."
          keyboard="number"
          value={slots}
          onChangeText={setSlots}
        />
        <Toggle label="Plan is on sale" value={active} onValueChange={setActive} />
        <Button
          label="Save plan"
          disabled={!valid}
          loading={createState.isLoading || updateState.isLoading}
          onPress={() => void save()}
        />
      </VStack>
    </Sheet>
  );
}
