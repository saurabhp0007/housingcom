import {
  AppText,
  Button,
  Chip,
  EmptyState,
  HStack,
  Screen,
  Skeleton,
  VStack,
  useTheme,
} from '@housingcom/ui';
import { formatDistance } from '@housingcom/utils';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSession } from '@/features/auth/hooks/useSession';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { useBrowseListingsQuery } from '@/features/listings/listings.api';
import { LocationPill } from '@/features/location/components/LocationPill';
import { LocationSheet } from '@/features/location/components/LocationSheet';
import { useNearbyAreasQuery } from '@/features/location/geo.api';
import { locationSelected } from '@/features/location/location.slice';
import { centerCleared } from '@/features/search/search.slice';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';

export default function HomeScreen() {
  const { colors, radius, spacing } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useSession();
  const { selected, hydrated } = useAppSelector((s) => s.location);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [autoPromptDismissed, setAutoPromptDismissed] = useState(false);
  // First run: ask where to look before showing anything location-based.
  const showSheet = sheetOpen || (hydrated && !selected && !autoPromptDismissed);
  const closeSheet = () => {
    setSheetOpen(false);
    setAutoPromptDismissed(true);
  };

  const { data: listings, isLoading: listingsLoading } = useBrowseListingsQuery(
    selected
      ? {
          lat: selected.coords.lat,
          lng: selected.coords.lng,
          radiusKm: 10,
          sort: 'recommended',
          limit: 10,
        }
      : {},
    { skip: !selected },
  );

  const { data: nearby, isLoading } = useNearbyAreasQuery(
    selected
      ? { lat: selected.coords.lat, lng: selected.coords.lng, radiusKm: 8, limit: 12 }
      : { lat: 0, lng: 0 },
    { skip: !selected },
  );

  return (
    <Screen scroll edges={['top']}>
      <VStack gap="xl" style={{ paddingTop: spacing.md }}>
        <VStack gap="sm">
          <AppText variant="caption" color="textSecondary">
            {user?.fullName ? `Hi ${user.fullName.split(' ')[0]}, looking in` : 'Looking in'}
          </AppText>
          <LocationPill onPress={() => setSheetOpen(true)} />
        </VStack>

        <Pressable
          accessibilityRole="search"
          onPress={() => router.navigate('/search')}
          style={({ pressed }) => [
            styles.search,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <HStack gap="sm" align="center">
            <SymbolView
              name={{ ios: 'magnifyingglass', android: 'search' }}
              size={20}
              tintColor={colors.textSecondary}
            />
            <AppText color="textSecondary">Search area, landmark, college or office</AppText>
          </HStack>
        </Pressable>

        <VStack gap="md">
          <AppText variant="heading">Areas near you</AppText>
          {!selected ? (
            <AppText color="textSecondary">Set a location to see nearby areas.</AppText>
          ) : isLoading ? (
            <HStack gap="sm" wrap>
              {[96, 120, 88, 132, 104].map((w, i) => (
                <Skeleton key={i} width={w} height={34} radius="pill" />
              ))}
            </HStack>
          ) : (
            <HStack gap="sm" wrap>
              {nearby?.map((area) => (
                <Chip
                  key={area.id}
                  label={`${area.name}${area.distanceKm !== undefined ? ` · ${formatDistance(area.distanceKm)}` : ''}`}
                  selected={area.id === selected.areaId}
                  onPress={() =>
                    dispatch(
                      locationSelected({
                        label: area.name,
                        coords: area.center,
                        cityId: area.cityId,
                        areaId: area.id,
                        source: 'manual',
                      }),
                    )
                  }
                />
              ))}
            </HStack>
          )}
        </VStack>

        <VStack gap="md">
          <HStack justify="space-between" align="center">
            <AppText variant="heading">Recommended near you</AppText>
            {selected ? (
              <Button
                label="See all"
                variant="text"
                fullWidth={false}
                onPress={() => {
                  dispatch(centerCleared());
                  router.navigate('/search');
                }}
              />
            ) : null}
          </HStack>
          {!selected ? null : listingsLoading ? (
            <VStack gap="lg">
              <Skeleton height={260} radius="lg" />
              <Skeleton height={260} radius="lg" />
            </VStack>
          ) : listings?.items.length ? (
            <VStack gap="lg">
              {listings.items.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  onPress={() => router.push(`/listing/${l.id}`)}
                />
              ))}
            </VStack>
          ) : (
            <EmptyState
              title="No listings here yet"
              description="Try a nearby area. New rooms, flats and PGs are added every day."
              actionLabel="Change location"
              onAction={() => setSheetOpen(true)}
            />
          )}
        </VStack>
      </VStack>

      <LocationSheet visible={showSheet} onDismiss={closeSheet} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { height: 52, borderWidth: 1, paddingHorizontal: 16, justifyContent: 'center' },
});
