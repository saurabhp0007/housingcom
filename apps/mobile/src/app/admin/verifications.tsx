import { VerificationStatus, type VerificationRequestResponse } from '@housingcom/contracts';
import {
  AppText,
  Card,
  Chip,
  EmptyState,
  HStack,
  Pill,
  Skeleton,
  VStack,
  useTheme,
} from '@housingcom/ui';
import { maskPhone } from '@housingcom/utils';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useVerificationQueueQuery } from '@/features/admin/admin.api';

const TABS = [
  { label: 'Pending', status: VerificationStatus.Pending },
  { label: 'Approved', status: VerificationStatus.Approved },
  { label: 'Rejected', status: VerificationStatus.Rejected },
];

export default function VerificationsScreen() {
  const { spacing, colors } = useTheme();
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.Pending);
  const { data, isLoading, isFetching, refetch } = useVerificationQueueQuery(
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
        <View style={{ padding: spacing.lg }}>
          <Skeleton height={80} radius="lg" />
        </View>
      ) : (
        <FlashList
          data={data?.items ?? []}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState title="All caught up" description="No requests in this state." />
          }
          renderItem={({ item }) => <RequestRow request={item} />}
        />
      )}
    </View>
  );
}

function RequestRow({ request: r }: { request: VerificationRequestResponse }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/review/verification/${r.id}`)}
    >
      <Card>
        <HStack justify="space-between" align="center">
          <VStack gap="xxs" flex={1}>
            <AppText variant="bodyStrong">{r.user?.name ?? 'Unnamed lister'}</AppText>
            <AppText variant="caption" color="textSecondary">
              {[
                r.user?.phone ? maskPhone(r.user.phone) : null,
                r.user?.listerType?.replace('_', ' '),
              ]
                .filter(Boolean)
                .join(' · ')}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              Submitted {new Date(r.createdAt).toLocaleString('en-IN')}
            </AppText>
          </VStack>
          <Pill
            label={r.status}
            tone={
              r.status === 'pending' ? 'warning' : r.status === 'approved' ? 'success' : 'danger'
            }
          />
        </HStack>
      </Card>
    </Pressable>
  );
}
