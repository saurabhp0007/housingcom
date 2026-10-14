import {
  AppText,
  Chip,
  EmptyState,
  HStack,
  Loader,
  Pill,
  Skeleton,
  VStack,
  useTheme,
  Icon,
} from '@housingcom/ui';
import { skipToken } from '@reduxjs/toolkit/query';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/features/auth/hooks/useSession';
import { FavoriteButton } from '@/features/engagement/components/FavoriteButton';
import { SaveSearchSheet } from '@/features/engagement/components/SaveSearchSheet';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { FiltersSheet } from '@/features/search/components/FiltersSheet';
import { SearchMap } from '@/features/search/components/SearchMap';
import { SORT_LABELS, SortSheet } from '@/features/search/components/SortSheet';
import { useSearchCenter } from '@/features/search/hooks/useSearchCenter';
import { useSearchListingsInfiniteQuery } from '@/features/search/search.api';
import {
  activeFilterCount,
  filtersApplied,
  sortChanged,
  viewChanged,
} from '@/features/search/search.slice';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';

/** Search: place + filters + sort, as a list or a map (PRD §3 "Finding a place"). */
export default function SearchScreen() {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { filters, sort, view } = useAppSelector((s) => s.search);
  const center = useSearchCenter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const { isAuthenticated } = useSession();
  const filterCount = activeFilterCount(filters);

  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useSearchListingsInfiniteQuery(
      center
        ? { filters, sort, lat: center.coords.lat, lng: center.coords.lng, radiusKm: 10 }
        : skipToken,
    );
  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.background }}>
      <VStack
        gap="sm"
        style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm }}
      >
        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Search area, landmark, college or office"
          onPress={() => router.push('/search-place')}
          style={({ pressed }) => [
            styles.bar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.pill,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Icon name="search" size={20} color={colors.textSecondary} />
          <VStack flex={1}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {center?.label ?? 'Search area, landmark, college…'}
            </AppText>
            {center?.subtitle ? (
              <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                {center.subtitle}
              </AppText>
            ) : null}
          </VStack>
        </Pressable>

        <HStack gap="sm" align="center">
          <Chip
            label={filterCount ? `Filters · ${filterCount}` : 'Filters'}
            selected={filterCount > 0}
            onPress={() => setFiltersOpen(true)}
          />
          <Chip label={SORT_LABELS[sort]} onPress={() => setSortOpen(true)} />
          {center ? (
            <Chip
              label="Save"
              onPress={() => (isAuthenticated ? setSaveOpen(true) : router.push('/login'))}
            />
          ) : null}
          <View style={{ flex: 1 }} />
          <Chip
            label="List"
            selected={view === 'list'}
            onPress={() => dispatch(viewChanged('list'))}
          />
          <Chip
            label="Map"
            selected={view === 'map'}
            onPress={() => dispatch(viewChanged('map'))}
          />
        </HStack>
      </VStack>

      {!center ? (
        <EmptyState
          title="Where do you want to live?"
          description="Search an area, landmark, college or office."
          actionLabel="Search"
          onAction={() => router.push('/search-place')}
        />
      ) : view === 'map' ? (
        <SearchMap
          key={`${center.coords.lat},${center.coords.lng}`}
          center={center.coords}
          filters={filters}
        />
      ) : isLoading ? (
        <VStack gap="lg" style={{ padding: spacing.lg }}>
          <Skeleton height={260} radius="lg" />
          <Skeleton height={260} radius="lg" />
        </VStack>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
          onEndReachedThreshold={0.6}
          onEndReached={() => hasNextPage && !isFetchingNextPage && void fetchNextPage()}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading && !isFetchingNextPage}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <HStack gap="xs" align="center" style={{ marginBottom: spacing.sm }}>
              <AppText variant="caption" color="textSecondary">
                {total} place{total === 1 ? '' : 's'} within 10 km
              </AppText>
              {sort === 'recommended' ? <Pill label="Ranked for you" tone="primary" /> : null}
            </HStack>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <VStack padding="lg" align="center">
                <Loader />
              </VStack>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              title="No places match"
              description={
                filterCount ? 'Try removing a filter or two.' : 'Try a nearby area or landmark.'
              }
              actionLabel={filterCount ? 'Clear filters' : 'Change place'}
              onAction={() =>
                filterCount ? dispatch(filtersApplied({})) : router.push('/search-place')
              }
            />
          }
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => router.push(`/listing/${item.id}`)}
              accessory={<FavoriteButton listingId={item.id} />}
            />
          )}
        />
      )}

      <FiltersSheet
        visible={filtersOpen}
        value={filters}
        onDismiss={() => setFiltersOpen(false)}
        onApply={(f) => {
          setFiltersOpen(false);
          dispatch(filtersApplied(f));
        }}
      />
      <SortSheet
        visible={sortOpen}
        value={sort}
        onDismiss={() => setSortOpen(false)}
        onChange={(s) => {
          setSortOpen(false);
          dispatch(sortChanged(s));
        }}
      />
      {center && isAuthenticated && saveOpen ? (
        <SaveSearchSheet
          center={center}
          filters={filters}
          visible={saveOpen}
          onDismiss={() => setSaveOpen(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
  },
});
