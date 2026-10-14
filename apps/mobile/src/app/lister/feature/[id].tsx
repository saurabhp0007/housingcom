import {
  AppText,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  HStack,
  Pill,
  Screen,
  Skeleton,
  VStack,
  useTheme,
} from '@housingcom/ui';
import { formatInr } from '@housingcom/utils';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FeatureStats } from '@/features/featured/components/FeatureStats';
import { PlanOption } from '@/features/featured/components/PlanOption';
import { useFeatureOptionsQuery } from '@/features/featured/featured.api';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { useMyListingQuery } from '@/features/listings/listings.api';
import { RazorpayCheckoutSheet } from '@/features/payments/components/RazorpayCheckoutSheet';
import { useFeaturePurchase } from '@/features/payments/hooks/useFeaturePurchase';

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Pick a featured plan for one listing and pay (PRD §4 "Feature a listing"). Deep link target for renewals. */
export default function FeatureListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spacing } = useTheme();
  const { data, isLoading, isError, refetch } = useFeatureOptionsQuery(id);
  const { data: listing } = useMyListingQuery(id);
  const [planId, setPlanId] = useState<string | null>(null);
  const purchase = useFeaturePurchase(() => void refetch());
  const busy = purchase.state !== 'idle';

  if (isLoading) {
    return (
      <Screen edges={['bottom']}>
        <VStack gap="md" style={{ paddingTop: spacing.lg }}>
          <Skeleton height={220} radius="lg" />
          <Skeleton height={72} radius="lg" />
        </VStack>
      </Screen>
    );
  }
  if (isError || !data) {
    return (
      <Screen edges={['bottom']}>
        <EmptyState
          title="Can't feature this listing"
          description="Only live listings can be featured. Make it live and try again."
          actionLabel="Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const selected = data.plans.find((p) => p.id === planId) ?? null;
  const current = data.current;

  return (
    <Screen
      scroll
      edges={['bottom']}
      footer={
        data.plans.length && data.slots.available ? (
          <Button
            label={selected ? `Pay ${formatInr(selected.priceInr)}` : 'Choose a plan'}
            disabled={!selected || busy}
            loading={busy}
            onPress={() => selected && void purchase.start(id, selected.id)}
          />
        ) : null
      }
    >
      <VStack gap="lg" style={{ paddingTop: spacing.lg }}>
        {listing ? (
          <ListingCard listing={listing} onPress={() => router.push(`/listing/${id}`)} />
        ) : null}

        {current ? (
          <Card tone="primary">
            <VStack gap="sm">
              <HStack justify="space-between" align="center">
                <AppText variant="bodyStrong">
                  {current.status === 'paused' ? 'Featured (paused by admin)' : 'Featured now'}
                </AppText>
                <Pill label={`Until ${formatDay(current.endsAt)}`} tone="featured" />
              </HStack>
              <FeatureStats feature={current} />
              <AppText variant="caption" color="textSecondary">
                Buying again adds days to the end of your current period.
              </AppText>
            </VStack>
          </Card>
        ) : (
          <VStack gap="xs">
            <AppText variant="title">Get more views</AppText>
            <AppText color="textSecondary">
              Featured listings appear at the top of search results, in “Featured in your area” on
              Home and with a highlighted pin on the map.
            </AppText>
          </VStack>
        )}

        {!data.slots.available ? (
          <EmptyState
            title="All featured spots here are taken"
            description={`This area allows ${data.slots.limit} featured listings at a time. Check back in a few days.`}
          />
        ) : data.plans.length === 0 ? (
          <EmptyState
            title="No plans yet"
            description="Featured plans for this area are coming soon."
          />
        ) : (
          <VStack gap="sm">
            <AppText variant="heading">{current ? 'Extend' : 'Choose a plan'}</AppText>
            {data.plans.map((p) => (
              <PlanOption
                key={p.id}
                plan={p}
                selected={p.id === planId}
                onPress={() => setPlanId(p.id)}
              />
            ))}
            {data.slots.limit !== null ? (
              <AppText variant="caption" color="textSecondary">
                {data.slots.limit - data.slots.used} of {data.slots.limit} featured spots left in
                this area.
              </AppText>
            ) : null}
          </VStack>
        )}
      </VStack>

      <RazorpayCheckoutSheet {...purchase.sheet} />
      <ConfirmDialog
        visible={purchase.simulation.visible}
        title="Test payment"
        message={`Payments run in test mode on this server. Simulate paying ${formatInr(purchase.simulation.amountInr)}?`}
        confirmLabel="Simulate payment"
        onConfirm={purchase.simulation.confirm}
        onDismiss={purchase.simulation.cancel}
      />
    </Screen>
  );
}
