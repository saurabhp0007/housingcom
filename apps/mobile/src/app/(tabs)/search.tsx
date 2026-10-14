import { AppText, Chip, EmptyState, HStack, Screen, TextField, VStack } from '@housingcom/ui';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useCityAreasQuery } from '@/features/location/geo.api';
import { locationSelected } from '@/features/location/location.slice';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';

/** Phase 1: find an area in the current city. Listing search and filters land in phase 3. */
export default function SearchScreen() {
  const dispatch = useAppDispatch();
  const cityId = useAppSelector((s) => s.location.selected?.cityId ?? null);
  const [query, setQuery] = useState('');
  const { data: areas } = useCityAreasQuery({ cityId: cityId ?? '' }, { skip: !cityId });

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (areas ?? []).filter((a) => !q || a.name.toLowerCase().includes(q));
  }, [areas, query]);

  return (
    <Screen scroll edges={['top']}>
      <VStack gap="xl" style={{ paddingTop: 12 }}>
        <AppText variant="title">Search</AppText>
        <TextField
          label="Area or landmark"
          placeholder="e.g. Koramangala"
          value={query}
          onChangeText={setQuery}
          returnKey="search"
          autoCapitalize="words"
        />
        {!cityId ? (
          <EmptyState
            title="Pick a city first"
            description="Set your location on the Home tab to search areas."
          />
        ) : matches.length === 0 ? (
          <EmptyState
            title="No matching areas"
            description="Try a different spelling or a nearby locality."
          />
        ) : (
          <HStack gap="sm" wrap>
            {matches.map((area) => (
              <Chip
                key={area.id}
                label={area.name}
                onPress={() => {
                  dispatch(
                    locationSelected({
                      label: area.name,
                      coords: area.center,
                      cityId: area.cityId,
                      areaId: area.id,
                      source: 'manual',
                    }),
                  );
                  router.navigate('/');
                }}
              />
            ))}
          </HStack>
        )}
      </VStack>
    </Screen>
  );
}
