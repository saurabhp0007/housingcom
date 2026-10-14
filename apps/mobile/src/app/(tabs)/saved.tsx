import type { SavedSearchResponse } from '@housingcom/contracts';
import {
  AppText,
  Card,
  Chip,
  ConfirmDialog,
  EmptyState,
  HStack,
  Loader,
  Screen,
  Skeleton,
  Toggle,
  VStack,
  useTheme,
} from '@housingcom/ui';
import { formatInr } from '@housingcom/utils';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSession } from '@/features/auth/hooks/useSession';
import {
  useDeleteSavedSearchMutation,
  useFavoritesInfiniteQuery,
  useSavedSearchesQuery,
  useUpdateSavedSearchMutation,
} from '@/features/engagement/engagement.api';
import { FavoriteButton } from '@/features/engagement/components/FavoriteButton';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { TYPE_LABELS_PLURAL } from '@/features/listings/listing-labels';
import { centerChosen, filtersApplied } from '@/features/search/search.slice';
import { useAppDispatch } from '@/shared/store/hooks';

type Tab = 'listings' | 'searches';

export default function SavedScreen() {
  const { spacing } = useTheme();
  const { isAuthenticated } = useSession();
  const [tab, setTab] = useState<Tab>('listings');

  if (!isAuthenticated) {
    return (
      <Screen edges={['top']}>
        <EmptyState
          title="Save places you like"
          description="Sign in to save listings and get alerts when similar places go live."
          actionLabel="Sign in"
          onAction={() => router.push('/login')}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} padded={false}>
      <VStack gap="sm" style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <AppText variant="title">Saved</AppText>
        <HStack gap="sm">
          <Chip label="Listings" selected={tab === 'listings'} onPress={() => setTab('listings')} />
          <Chip label="Searches" selected={tab === 'searches'} onPress={() => setTab('searches')} />
        </HStack>
      </VStack>
      {tab === 'listings' ? <SavedListings /> : <SavedSearches />}
    </Screen>
  );
}

function SavedListings() {
  const { spacing, colors } = useTheme();
  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useFavoritesInfiniteQuery();
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <View style={{ padding: spacing.lg }}>
        <Skeleton height={260} radius="lg" />
      </View>
    );
  }
  return (
    <FlashList
      data={items}
      keyExtractor={(l) => l.id}
      contentContainerStyle={{ padding: spacing.lg }}
      ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
      onEndReachedThreshold={0.6}
      onEndReached={() => hasNextPage && !isFetchingNextPage && void fetchNextPage()}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isFetchingNextPage}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
      ListFooterComponent={isFetchingNextPage ? <Loader /> : null}
      ListEmptyComponent={
        <EmptyState
          title="Nothing saved yet"
          description="Tap the heart on any listing to keep it here."
          actionLabel="Find places"
          onAction={() => router.navigate('/search')}
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
  );
}

/** e.g. "Flats, PGs · up to ₹15,000 · 2 more filters · 10 km" */
function describe(s: SavedSearchResponse): string {
  const f = s.filters;
  const parts: string[] = [];
  parts.push(f.types?.length ? f.types.map((t) => TYPE_LABELS_PLURAL[t]).join(', ') : 'All types');
  if (f.minRent !== undefined || f.maxRent !== undefined) {
    parts.push(
      f.maxRent !== undefined
        ? `${f.minRent ? `${formatInr(f.minRent)}–` : 'up to '}${formatInr(f.maxRent)}`
        : `from ${formatInr(f.minRent!)}`,
    );
  }
  const extra = Object.entries(f).filter(
    ([k, v]) => !['types', 'minRent', 'maxRent'].includes(k) && v !== undefined && v !== false,
  ).length;
  if (extra) parts.push(`${extra} more filter${extra > 1 ? 's' : ''}`);
  return `${parts.join(' · ')} · ${s.radiusKm} km`;
}

function SavedSearches() {
  const { spacing, colors } = useTheme();
  const dispatch = useAppDispatch();
  const { data, isLoading, isFetching, refetch } = useSavedSearchesQuery();
  const [update] = useUpdateSavedSearchMutation();
  const [remove] = useDeleteSavedSearchMutation();
  const [deleting, setDeleting] = useState<SavedSearchResponse | null>(null);

  const open = (s: SavedSearchResponse) => {
    dispatch(centerChosen({ label: s.label, subtitle: null, coords: s.center }));
    dispatch(filtersApplied(s.filters));
    router.navigate('/search');
  };

  if (isLoading) {
    return (
      <View style={{ padding: spacing.lg }}>
        <Skeleton height={90} radius="lg" />
      </View>
    );
  }
  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
      }
    >
      {data?.length ? (
        data.map((s) => (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            onPress={() => open(s)}
            onLongPress={() => setDeleting(s)}
          >
            <Card>
              <VStack gap="sm">
                <VStack gap="xxs">
                  <AppText variant="bodyStrong">{s.label}</AppText>
                  <AppText variant="caption" color="textSecondary">
                    {describe(s)}
                  </AppText>
                </VStack>
                <Toggle
                  label="New-match alerts"
                  value={s.alertsEnabled}
                  onValueChange={(alertsEnabled) =>
                    void update({
                      id: s.id,
                      body: {
                        label: s.label,
                        lat: s.center.lat,
                        lng: s.center.lng,
                        radiusKm: s.radiusKm,
                        filters: s.filters,
                        alertsEnabled,
                      },
                    })
                  }
                />
              </VStack>
            </Card>
          </Pressable>
        ))
      ) : (
        <EmptyState
          title="No saved searches"
          description="On Search, tap Save to keep a place + filters and get alerts for new matches."
        />
      )}
      {data?.length ? (
        <AppText variant="caption" color="textSecondary" align="center">
          Long-press a search to delete it.
        </AppText>
      ) : null}

      <ConfirmDialog
        visible={!!deleting}
        title="Delete saved search?"
        message={deleting?.label}
        confirmLabel="Delete"
        destructive
        onDismiss={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void remove(deleting.id);
          setDeleting(null);
        }}
      />
    </ScrollView>
  );
}
