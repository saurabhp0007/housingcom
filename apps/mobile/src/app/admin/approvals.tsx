import { ListingStatus } from '@housingcom/contracts';
import { AppText, Chip, EmptyState, Skeleton, VStack, useTheme } from '@housingcom/ui';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useModerationQueueQuery } from '@/features/admin/admin.api';
import { ListingCard } from '@/features/listings/components/ListingCard';

const TABS = [
  { label: 'To review', status: ListingStatus.PendingApproval },
  { label: 'Rejected', status: ListingStatus.Rejected },
  { label: 'Live', status: ListingStatus.Live },
];

/** Approval queue: oldest submissions first. */
export default function ApprovalsScreen() {
  const { spacing, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<ListingStatus>(ListingStatus.PendingApproval);
  const { data, isLoading, isFetching, refetch } = useModerationQueueQuery(
    { status },
    { refetchOnFocus: true },
  );

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
        <VStack gap="lg" style={{ padding: spacing.lg }}>
          <Skeleton height={260} radius="lg" />
        </VStack>
      ) : (
        <FlashList
          data={data?.items ?? []}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.lg + insets.bottom }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            data ? (
              <AppText variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>
                {data.meta.total} listing{data.meta.total === 1 ? '' : 's'}
              </AppText>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState title="All caught up" description="No listings in this state." />
          }
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => router.push(`/review/listing/${item.id}`)}
              footer={
                item.rejectionReason ? (
                  <AppText variant="caption" color="danger" numberOfLines={2}>
                    {item.rejectionReason}
                  </AppText>
                ) : null
              }
            />
          )}
        />
      )}
    </View>
  );
}
