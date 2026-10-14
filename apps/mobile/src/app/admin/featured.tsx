import { FeatureStatus, type ListingFeatureResponse } from '@housingcom/contracts';
import {
  AppText,
  Button,
  Chip,
  EmptyState,
  HStack,
  Pill,
  Skeleton,
  VStack,
  useTheme,
  useToast,
} from '@housingcom/ui';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import {
  useAdminFeatureActionMutation,
  useAdminFeaturedQuery,
} from '@/features/featured/featured.api';
import { FeatureStats } from '@/features/featured/components/FeatureStats';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { toAppError } from '@/shared/api/api-error';

const TABS = [
  { label: 'Active', status: FeatureStatus.Active },
  { label: 'Paused', status: FeatureStatus.Paused },
  { label: 'Ended', status: FeatureStatus.Expired },
  { label: 'Removed', status: FeatureStatus.Removed },
];

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** Featured listings (PRD §5): view, pause or remove. Pin new ones from a listing's review page. */
export default function AdminFeaturedScreen() {
  const { spacing, colors } = useTheme();
  const toast = useToast();
  const [status, setStatus] = useState<FeatureStatus>(FeatureStatus.Active);
  const { data, isLoading, isFetching, refetch } = useAdminFeaturedQuery(
    { status },
    { refetchOnFocus: true },
  );
  const [act] = useAdminFeatureActionMutation();

  const run = (f: ListingFeatureResponse, action: 'pause' | 'resume' | 'remove') =>
    void act({ id: f.id, action })
      .unwrap()
      .then(() =>
        toast.show({
          message: `Featured listing ${action === 'remove' ? 'removed' : `${action}d`}`,
        }),
      )
      .catch((e: unknown) => toast.show({ message: toAppError(e).message }));

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm }}
      >
        {TABS.map((t) => (
          <Chip
            key={t.status}
            label={t.label}
            selected={status === t.status}
            onPress={() => setStatus(t.status)}
          />
        ))}
      </ScrollView>
      {isLoading ? (
        <View style={{ padding: spacing.lg }}>
          <Skeleton height={300} radius="lg" />
        </View>
      ) : (
        <FlashList
          data={data?.items ?? []}
          keyExtractor={(f) => f.id}
          contentContainerStyle={{ padding: spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState title="Nothing here" description="No featured listings in this state." />
          }
          renderItem={({ item: f }) => (
            <ListingCard
              listing={f.listing}
              onPress={() => router.push(`/review/listing/${f.listing.id}`)}
              badge={f.pinned ? <Pill label="Pinned" tone="warning" /> : null}
              footer={
                <VStack gap="sm" style={{ marginTop: spacing.sm }}>
                  <HStack justify="space-between">
                    <AppText variant="caption" color="textSecondary">
                      {f.source === 'admin' ? 'Admin' : (f.planName ?? 'Paid')} ·{' '}
                      {formatDay(f.startsAt)} – {formatDay(f.endsAt)}
                    </AppText>
                  </HStack>
                  <FeatureStats feature={f} />
                  {f.status === FeatureStatus.Active || f.status === FeatureStatus.Paused ? (
                    <HStack gap="sm">
                      <View style={{ flex: 1 }}>
                        {f.status === FeatureStatus.Active ? (
                          <Button
                            label="Pause"
                            variant="outlined"
                            onPress={() => run(f, 'pause')}
                          />
                        ) : (
                          <Button label="Resume" onPress={() => run(f, 'resume')} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button
                          label="Remove"
                          variant="destructive"
                          onPress={() => run(f, 'remove')}
                        />
                      </View>
                    </HStack>
                  ) : null}
                </VStack>
              }
            />
          )}
        />
      )}
    </View>
  );
}
