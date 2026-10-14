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
  Icon,
} from '@housingcom/ui';
import { formatDistance } from '@housingcom/utils';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { BannerCarousel } from '@/features/content/components/BannerCarousel';
import { FavoriteButton } from '@/features/engagement/components/FavoriteButton';
import { FeaturedSection } from '@/features/featured/components/FeaturedSection';
import { useSession } from '@/features/auth/hooks/useSession';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { useBrowseListingsQuery } from '@/features/listings/listings.api';
import { LocationPill } from '@/features/location/components/LocationPill';
import { LocationSheet } from '@/features/location/components/LocationSheet';
import { useCitiesQuery, useNearbyAreasQuery } from '@/features/location/geo.api';
import { locationSelected } from '@/features/location/location.slice';
import type { ListingCardResponse } from '@housingcom/contracts';
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
          // A whole city is wider than one area.
          radiusKm: selected.areaId ? 10 : 25,
          sort: 'recommended',
          limit: 10,
        }
      : {},
    { skip: !selected },
  );

  // Nothing chosen yet, or nothing close by: show what is popular everywhere instead of a blank page.
  const nearbyEmpty = !!selected && !listingsLoading && !listings?.items.length;
  const { data: popular, isLoading: popularLoading } = useBrowseListingsQuery(
    { sort: 'recommended', limit: 10 },
    { skip: !!selected && !nearbyEmpty },
  );
  const { data: cities } = useCitiesQuery(undefined, { skip: !!selected });

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
            <Icon name="search" size={20} color={colors.textSecondary} />
            <AppText color="textSecondary">Search area, landmark, college or office</AppText>
          </HStack>
        </Pressable>

        <BannerCarousel cityId={selected?.cityId ?? null} />

        {selected ? <FeaturedSection lat={selected.coords.lat} lng={selected.coords.lng} /> : null}

        <VStack gap="md">
          <AppText variant="heading">{selected ? 'Areas near you' : 'Popular cities'}</AppText>
          {!selected ? (
            <HStack gap="sm" wrap>
              {cities?.map((city) => (
                <Chip
                  key={city.id}
                  label={city.name}
                  onPress={() =>
                    dispatch(
                      locationSelected({
                        label: city.name,
                        coords: city.center,
                        cityId: city.id,
                        areaId: null,
                        source: 'manual',
                      }),
                    )
                  }
                />
              ))}
            </HStack>
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

        {selected && !nearbyEmpty ? (
          <VStack gap="md">
            <HStack justify="space-between" align="center">
              <AppText variant="heading">Recommended near you</AppText>
              <Button
                label="See all"
                variant="text"
                fullWidth={false}
                onPress={() => {
                  dispatch(centerCleared());
                  router.navigate('/search');
                }}
              />
            </HStack>
            {listingsLoading ? <CardSkeletons /> : <ListingList items={listings?.items ?? []} />}
          </VStack>
        ) : (
          <VStack gap="md">
            <VStack gap="xxs">
              <AppText variant="heading">Popular right now</AppText>
              {nearbyEmpty ? (
                <AppText variant="caption" color="textSecondary">
                  Nothing near {selected.label} yet. Here is what people are viewing elsewhere.
                </AppText>
              ) : null}
            </VStack>
            {popularLoading ? (
              <CardSkeletons />
            ) : popular?.items.length ? (
              <ListingList items={popular.items} />
            ) : (
              <EmptyState
                title="No listings yet"
                description="New rooms, flats and PGs are added every day."
                actionLabel="Change location"
                onAction={() => setSheetOpen(true)}
              />
            )}
          </VStack>
        )}
      </VStack>

      <LocationSheet visible={showSheet} onDismiss={closeSheet} />
    </Screen>
  );
}

function CardSkeletons() {
  return (
    <VStack gap="lg">
      <Skeleton height={260} radius="lg" />
      <Skeleton height={260} radius="lg" />
    </VStack>
  );
}

function ListingList({ items }: { items: ListingCardResponse[] }) {
  return (
    <VStack gap="lg">
      {items.map((l) => (
        <ListingCard
          key={l.id}
          listing={l}
          onPress={() => router.push(`/listing/${l.id}`)}
          accessory={<FavoriteButton listingId={l.id} />}
        />
      ))}
    </VStack>
  );
}

const styles = StyleSheet.create({
  search: { height: 52, borderWidth: 1, paddingHorizontal: 16, justifyContent: 'center' },
});
