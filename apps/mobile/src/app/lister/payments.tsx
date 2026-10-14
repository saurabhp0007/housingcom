import { EmptyState, Skeleton, useTheme } from '@housingcom/ui';
import { FlashList } from '@shopify/flash-list';
import { RefreshControl, View } from 'react-native';
import { useMyPaymentsQuery } from '@/features/featured/featured.api';
import { PaymentRow } from '@/features/payments/components/PaymentRow';

/** Payment history with gateway references (for support queries). */
export default function MyPaymentsScreen() {
  const { spacing, colors } = useTheme();
  const { data, isLoading, isFetching, refetch } = useMyPaymentsQuery();
  if (isLoading) {
    return (
      <View style={{ padding: spacing.lg }}>
        <Skeleton height={90} radius="lg" />
      </View>
    );
  }
  return (
    <FlashList
      data={data?.items ?? []}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{ padding: spacing.lg }}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
      }
      ListEmptyComponent={
        <EmptyState title="No payments yet" description="Featured plan payments show up here." />
      }
      renderItem={({ item }) => <PaymentRow payment={item} />}
    />
  );
}
