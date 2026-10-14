import { VisitStatus, type VisitResponse } from '@housingcom/contracts';
import {
  AppText,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  HStack,
  Pill,
  Skeleton,
  VStack,
  useTheme,
  useToast,
} from '@housingcom/ui';
import { formatInr } from '@housingcom/utils';
import { FlashList } from '@shopify/flash-list';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { useCancelVisitMutation, useMyVisitsQuery } from '@/features/engagement/engagement.api';
import { VISIT_STATUS_META, visitWhen } from '@/features/engagement/visit-labels';
import { toAppError } from '@/shared/api/api-error';

/** Customer's visit requests (deep link from "Visit confirmed" notifications). */
export default function MyVisitsScreen() {
  const { spacing, colors } = useTheme();
  const toast = useToast();
  const { data, isLoading, isFetching, refetch } = useMyVisitsQuery(undefined, {
    refetchOnFocus: true,
  });
  const [cancel, { isLoading: cancelling }] = useCancelVisitMutation();
  const [confirming, setConfirming] = useState<VisitResponse | null>(null);

  return (
    <>
      <Stack.Screen options={{ title: 'My visits', headerShown: true, headerBackTitle: 'Back' }} />
      {isLoading ? (
        <View style={{ padding: spacing.lg }}>
          <Skeleton height={120} radius="lg" />
        </View>
      ) : (
        <FlashList
          data={data?.items ?? []}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ padding: spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No visits planned"
              description="Use “Contact owner → Schedule a visit” on any listing."
            />
          }
          renderItem={({ item: v }) => {
            const meta = VISIT_STATUS_META[v.status];
            const open = v.status === VisitStatus.Requested || v.status === VisitStatus.Confirmed;
            return (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/listing/${v.listing.id}`)}
              >
                <Card>
                  <VStack gap="xs">
                    <HStack justify="space-between" align="center" gap="sm">
                      <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                        {v.listing.title}
                      </AppText>
                      <Pill label={meta.label} tone={meta.tone} />
                    </HStack>
                    <AppText color="textSecondary">
                      {formatInr(v.listing.rent)}/month
                      {v.listing.areaName ? ` · ${v.listing.areaName}` : ''}
                    </AppText>
                    <AppText variant="bodyStrong">{visitWhen(v)}</AppText>
                    {v.ownerNote ? (
                      <AppText color="textSecondary">Owner: “{v.ownerNote}”</AppText>
                    ) : null}
                    {open ? (
                      <Button
                        label="Cancel visit"
                        variant="text"
                        fullWidth={false}
                        onPress={() => setConfirming(v)}
                      />
                    ) : null}
                  </VStack>
                </Card>
              </Pressable>
            );
          }}
        />
      )}
      <ConfirmDialog
        visible={!!confirming}
        title="Cancel this visit?"
        message="The owner will be notified."
        confirmLabel={cancelling ? 'Cancelling…' : 'Cancel visit'}
        cancelLabel="Keep"
        destructive
        onDismiss={() => setConfirming(null)}
        onConfirm={() => {
          if (!confirming) return;
          void cancel(confirming.id)
            .unwrap()
            .catch((e: unknown) => toast.show({ message: toAppError(e).message }));
          setConfirming(null);
        }}
      />
    </>
  );
}
