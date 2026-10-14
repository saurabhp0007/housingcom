import { AppText, Button, Chip, HStack, Sheet, Skeleton, VStack, useToast } from '@housingcom/ui';
import { useState } from 'react';
import type { AreaResponse } from '@housingcom/contracts';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { useCitiesQuery, useCityAreasQuery } from '../geo.api';
import { useDetectLocation } from '../hooks/useDetectLocation';
import { locationSelected } from '../location.slice';

interface LocationSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

/** Native bottom sheet: use GPS, or pick a city and a popular area. */
export function LocationSheet({ visible, onDismiss }: LocationSheetProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const permission = useAppSelector((s) => s.location.permission);
  const selectedCityId = useAppSelector((s) => s.location.selected?.cityId ?? null);
  const { detect, detecting, openSettings } = useDetectLocation();

  const { data: cities, isLoading: citiesLoading } = useCitiesQuery();
  const [cityId, setCityId] = useState<string | null>(selectedCityId);
  const activeCityId = cityId ?? cities?.[0]?.id ?? null;
  const { data: areas, isFetching: areasLoading } = useCityAreasQuery(
    { cityId: activeCityId ?? '', popular: true },
    { skip: !activeCityId },
  );

  const useGps = async () => {
    const result = await detect();
    if (result === 'ok') return onDismiss();
    if (result === 'unserviceable') toast.show("We're not in your area yet. Pick a city below.");
    if (result === 'error') toast.show("Couldn't get your location. Try again or pick a city.");
  };

  const pickArea = (area: AreaResponse) => {
    dispatch(
      locationSelected({
        label: area.name,
        coords: area.center,
        cityId: area.cityId,
        areaId: area.id,
        source: 'manual',
      }),
    );
    onDismiss();
  };

  return (
    <Sheet
      visible={visible}
      onDismiss={onDismiss}
      title="Where are you looking?"
      snapPoints={['half', 'full']}
    >
      {permission === 'denied' ? (
        <VStack gap="sm">
          <AppText color="textSecondary">
            Location is off for this app. Turn it on to see places near you.
          </AppText>
          <Button label="Open settings" variant="tonal" onPress={openSettings} />
        </VStack>
      ) : (
        <Button label="Use my current location" loading={detecting} onPress={useGps} />
      )}

      <VStack gap="sm">
        <AppText variant="label" color="textSecondary">
          CITY
        </AppText>
        <HStack gap="sm" wrap>
          {citiesLoading
            ? [0, 1, 2].map((i) => <Skeleton key={i} width={90} height={34} radius="pill" />)
            : cities?.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  selected={c.id === activeCityId}
                  onPress={() => setCityId(c.id)}
                />
              ))}
        </HStack>
      </VStack>

      <VStack gap="sm">
        <AppText variant="label" color="textSecondary">
          POPULAR AREAS
        </AppText>
        <HStack gap="sm" wrap>
          {areasLoading
            ? [0, 1, 2, 3].map((i) => <Skeleton key={i} width={110} height={34} radius="pill" />)
            : areas?.map((a) => <Chip key={a.id} label={a.name} onPress={() => pickArea(a)} />)}
        </HStack>
      </VStack>
    </Sheet>
  );
}
