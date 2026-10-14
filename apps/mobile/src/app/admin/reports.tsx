import { REPORT_REASON_LABELS, ReportStatus, type ReportResponse } from '@housingcom/contracts';
import {
  AppText,
  Button,
  Chip,
  EmptyState,
  HStack,
  Pill,
  Sheet,
  Skeleton,
  TextField,
  VStack,
  useTheme,
  useToast,
} from '@housingcom/ui';
import { timeAgo } from '@housingcom/utils';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import {
  useAdminReportsQuery,
  useDismissReportMutation,
  useRemoveReportedListingMutation,
} from '@/features/admin/admin.api';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { toAppError } from '@/shared/api/api-error';

const TABS = [
  { label: 'Open', status: ReportStatus.Open },
  { label: 'Taken down', status: ReportStatus.Actioned },
  { label: 'Dismissed', status: ReportStatus.Dismissed },
];

type Action = { report: ReportResponse; kind: 'dismiss' | 'remove' };

/** User reports on listings: dismiss, or take the listing down with a reason for the owner. */
export default function ReportsScreen() {
  const { spacing, colors } = useTheme();
  const [status, setStatus] = useState<ReportStatus>(ReportStatus.Open);
  const { data, isLoading, isFetching, refetch } = useAdminReportsQuery(
    { status },
    { refetchOnFocus: true },
  );
  const [action, setAction] = useState<Action | null>(null);

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
          keyExtractor={(r) => r.id}
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
            <EmptyState title="Nothing to review" description="No reports here." />
          }
          renderItem={({ item: r }) => (
            <ListingCard
              listing={r.listing}
              onPress={() => router.push(`/review/listing/${r.listing.id}`)}
              badge={
                r.openReportsOnListing > 1 ? (
                  <Pill label={`${r.openReportsOnListing} reports`} tone="danger" />
                ) : null
              }
              footer={
                <VStack gap="xs" style={{ marginTop: spacing.sm }}>
                  <HStack justify="space-between" align="center">
                    <Pill label={REPORT_REASON_LABELS[r.reason]} tone="warning" />
                    <AppText variant="caption" color="textSecondary">
                      {r.reporter.name ?? 'User'} · {timeAgo(r.createdAt)}
                    </AppText>
                  </HStack>
                  {r.details ? <AppText color="textSecondary">“{r.details}”</AppText> : null}
                  {r.resolutionNote ? (
                    <AppText variant="caption" color="textSecondary">
                      Resolution: {r.resolutionNote}
                    </AppText>
                  ) : null}
                  {r.status === ReportStatus.Open ? (
                    <HStack gap="sm">
                      <View style={{ flex: 1 }}>
                        <Button
                          label="Dismiss"
                          variant="outlined"
                          onPress={() => setAction({ report: r, kind: 'dismiss' })}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button
                          label="Take down"
                          variant="destructive"
                          onPress={() => setAction({ report: r, kind: 'remove' })}
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
      <ResolveSheet action={action} onDismiss={() => setAction(null)} />
    </View>
  );
}

function ResolveSheet({ action, onDismiss }: { action: Action | null; onDismiss: () => void }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [dismiss, { isLoading: dismissing }] = useDismissReportMutation();
  const [remove, { isLoading: removing }] = useRemoveReportedListingMutation();
  const isRemove = action?.kind === 'remove';

  const submit = async () => {
    if (!action) return;
    try {
      if (isRemove) await remove({ id: action.report.id, reason: text.trim() }).unwrap();
      else await dismiss({ id: action.report.id, note: text.trim() || undefined }).unwrap();
      setText('');
      onDismiss();
      toast.show({
        message: isRemove ? 'Listing taken down. The owner was notified.' : 'Report dismissed.',
      });
    } catch (e) {
      toast.show({ message: toAppError(e).message });
    }
  };

  return (
    <Sheet
      visible={!!action}
      onDismiss={onDismiss}
      title={isRemove ? 'Take listing down' : 'Dismiss report'}
    >
      <VStack gap="md">
        <TextField
          label={isRemove ? 'Reason shown to the owner' : 'Note (optional)'}
          value={text}
          onChangeText={setText}
          maxLength={500}
          multiline
          error={
            isRemove && text.length > 0 && text.trim().length < 5
              ? 'At least 5 characters'
              : undefined
          }
        />
        <Button
          label={isRemove ? 'Take down' : 'Dismiss'}
          variant={isRemove ? 'destructive' : 'primary'}
          disabled={isRemove && text.trim().length < 5}
          loading={dismissing || removing}
          onPress={() => void submit()}
        />
      </VStack>
    </Sheet>
  );
}
