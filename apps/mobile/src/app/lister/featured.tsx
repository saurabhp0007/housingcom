import { FeatureStatus, type ListingFeatureResponse } from '@housingcom/contracts';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  HStack,
  Pill,
  Skeleton,
  VStack,
  useTheme,
} from '@housingcom/ui';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { RefreshControl, View } from 'react-native';
import { FeatureStats } from '@/features/featured/components/FeatureStats';
import { useMyFeaturedQuery } from '@/features/featured/featured.api';

const STATUS: Record<
  FeatureStatus,
  { label: string; tone: 'featured' | 'neutral' | 'warning' | 'danger' }
> = {
  active: { label: 'Featured', tone: 'featured' },
  paused: { label: 'Paused by admin', tone: 'warning' },
  expired: { label: 'Ended', tone: 'neutral' },
  removed: { label: 'Removed', tone: 'danger' },
};

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const daysLeft = (iso: string) =>
  Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000));

/** Featured listings with their performance (PRD: impressions, views and leads) and renewal. */
export default function MyFeaturedScreen() {
  const { spacing, colors } = useTheme();
  const { data, isLoading, isFetching, refetch } = useMyFeaturedQuery(undefined, {
    refetchOnFocus: true,
  });

  if (isLoading) {
    return (
      <View style={{ padding: spacing.lg }}>
        <Skeleton height={180} radius="lg" />
      </View>
    );
  }
  return (
    <FlashList
      data={data ?? []}
      keyExtractor={(f) => f.id}
      contentContainerStyle={{ padding: spacing.lg }}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
      }
      ListEmptyComponent={
        <EmptyState
          title="Nothing featured yet"
          description="Feature a live listing to show it at the top of searches in its area."
          actionLabel="My listings"
          onAction={() => router.navigate('/lister')}
        />
      }
      renderItem={({ item }) => <FeatureCard feature={item} />}
    />
  );
}

function FeatureCard({ feature: f }: { feature: ListingFeatureResponse }) {
  const status = STATUS[f.status];
  const open = f.status === FeatureStatus.Active || f.status === FeatureStatus.Paused;
  return (
    <Card>
      <VStack gap="sm">
        <HStack justify="space-between" align="center" gap="sm">
          <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {f.listing.title}
          </AppText>
          <Pill label={status.label} tone={status.tone} />
        </HStack>
        <AppText variant="caption" color="textSecondary">
          {f.planName ?? 'Featured'} · {formatDay(f.startsAt)} – {formatDay(f.endsAt)}
          {f.status === FeatureStatus.Active ? ` · ${daysLeft(f.endsAt)} days left` : ''}
        </AppText>
        <FeatureStats feature={f} />
        <Button
          label={open ? 'Extend' : 'Feature again'}
          variant={open ? 'tonal' : 'primary'}
          onPress={() => router.push(`/lister/feature/${f.listing.id}`)}
        />
      </VStack>
    </Card>
  );
}
