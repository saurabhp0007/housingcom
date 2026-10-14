import type { PlaceSuggestion } from '@housingcom/contracts';
import {
  AppText,
  Button,
  HStack,
  Loader,
  Screen,
  TextField,
  VStack,
  useTheme,
  useToast,
  Icon,
} from '@housingcom/ui';
import { skipToken } from '@reduxjs/toolkit/query';
import * as Crypto from 'expo-crypto';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useDetectLocation } from '@/features/location/hooks/useDetectLocation';
import { useLazyPlaceDetailsQuery, usePlacesAutocompleteQuery } from '@/features/search/search.api';
import {
  centerChosen,
  centerCleared,
  recentCleared,
  type SearchCenter,
} from '@/features/search/search.slice';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';

/** "Type any area, landmark, college or office" → results around it (PRD §3). */
export default function SearchPlaceScreen() {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const recent = useAppSelector((s) => s.search.recent);
  const bias = useAppSelector((s) => s.location.selected?.coords);
  const [q, setQ] = useState('');
  // One token per search session groups Google autocomplete + details billing.
  const [sessionToken] = useState(() => Crypto.randomUUID());
  const query = useDebouncedValue(q.trim(), 250);
  const { data: suggestions, isFetching } = usePlacesAutocompleteQuery(
    query.length >= 2 ? { q: query, lat: bias?.lat, lng: bias?.lng, sessionToken } : skipToken,
  );
  const [loadDetails, detailsState] = useLazyPlaceDetailsQuery();
  const { detect, detecting } = useDetectLocation();

  const choose = (center: SearchCenter) => {
    dispatch(centerChosen(center));
    router.back();
  };

  const pick = async (s: PlaceSuggestion) => {
    if (s.location) return choose({ label: s.title, subtitle: s.subtitle, coords: s.location });
    try {
      const details = await loadDetails({ id: s.id, sessionToken }).unwrap();
      choose({ label: s.title, subtitle: details.address ?? s.subtitle, coords: details.location });
    } catch {
      toast.show("Couldn't open that place. Try another.");
    }
  };

  const nearMe = async () => {
    const result = await detect();
    if (result === 'ok') {
      dispatch(centerCleared());
      router.back();
    } else if (result === 'denied')
      toast.show('Allow location access in Settings to search near you.');
    else if (result === 'unserviceable') toast.show("We're not in your area yet.");
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Search a place' }} />
      <Screen scroll edges={['bottom']}>
        <VStack gap="lg" style={{ paddingTop: 12 }}>
          <TextField
            label="Area, landmark, college or office"
            placeholder="e.g. Koramangala, Christ University, Manyata Tech Park"
            value={q}
            onChangeText={setQ}
            autoFocus
            returnKey="search"
            autoCapitalize="words"
          />

          <Button
            label="Use my current location"
            variant="tonal"
            loading={detecting}
            onPress={() => void nearMe()}
          />

          {query.length >= 2 ? (
            <VStack gap="xxs">
              {isFetching || detailsState.isFetching ? <Loader /> : null}
              {suggestions?.map((s) => (
                <Row
                  key={`${s.source}-${s.id}`}
                  icon={s.source === 'area' ? 'area' : 'place'}
                  title={s.title}
                  subtitle={s.subtitle}
                  onPress={() => void pick(s)}
                />
              ))}
              {!isFetching && suggestions?.length === 0 ? (
                <AppText color="textSecondary">
                  No matches. Try a nearby locality or landmark.
                </AppText>
              ) : null}
            </VStack>
          ) : recent.length > 0 ? (
            <VStack gap="xxs">
              <HStack justify="space-between" align="center">
                <AppText variant="label" color="textSecondary">
                  RECENT SEARCHES
                </AppText>
                <Button
                  label="Clear"
                  variant="text"
                  fullWidth={false}
                  onPress={() => dispatch(recentCleared())}
                />
              </HStack>
              {recent.map((r) => (
                <Row
                  key={`${r.label}-${r.subtitle}`}
                  icon="recent"
                  title={r.label}
                  subtitle={r.subtitle}
                  onPress={() => choose(r)}
                />
              ))}
            </VStack>
          ) : null}
        </VStack>
      </Screen>
    </>
  );
}

type RowIcon = 'area' | 'place' | 'recent';

const ROW_SYMBOLS = {
  area: 'map-outline',
  place: 'business-outline',
  recent: 'time-outline',
} as const;

function Row({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: RowIcon;
  title: string;
  subtitle: string | null;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.6 : 1, borderBottomColor: colors.border },
      ]}
    >
      <Icon name={ROW_SYMBOLS[icon]} size={20} color={colors.textSecondary} />
      <VStack flex={1} gap="xxs">
        <AppText variant="bodyStrong" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </VStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
