import { PaymentStatus } from '@housingcom/contracts';
import { Chip, EmptyState, Skeleton, useTheme } from '@housingcom/ui';
import { FlashList } from '@shopify/flash-list';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useAdminPaymentsQuery } from '@/features/featured/featured.api';
import { PaymentRow } from '@/features/payments/components/PaymentRow';

const TABS: { label: string; status?: PaymentStatus }[] = [
  { label: 'All' },
  { label: 'Paid', status: PaymentStatus.Paid },
  { label: 'Failed', status: PaymentStatus.Failed },
  { label: 'Not completed', status: PaymentStatus.Created },
];

export default function AdminPaymentsScreen() {
  const { spacing, colors } = useTheme();
  const [status, setStatus] = useState<PaymentStatus | undefined>(undefined);
  const { data, isLoading, isFetching, refetch } = useAdminPaymentsQuery(
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
            key={t.label}
            label={t.label}
            selected={status === t.status}
            onPress={() => setStatus(t.status)}
          />
        ))}
      </ScrollView>
      {isLoading ? (
        <View style={{ padding: spacing.lg }}>
          <Skeleton height={90} radius="lg" />
        </View>
      ) : (
        <FlashList
          data={data?.items ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={<EmptyState title="No payments" />}
          renderItem={({ item }) => <PaymentRow payment={item} />}
        />
      )}
    </View>
  );
}
