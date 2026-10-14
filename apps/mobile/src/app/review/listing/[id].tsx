import { Button, EmptyState, HStack, Loader, Screen, VStack, useToast } from '@housingcom/ui';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import {
  useAdminListingQuery,
  useApproveListingMutation,
  useRejectListingMutation,
} from '@/features/admin/admin.api';
import { RejectSheet } from '@/features/admin/components/RejectSheet';
import { PinListingSheet } from '@/features/featured/components/PinListingSheet';
import { ListingDetailView } from '@/features/listings/components/ListingDetailView';
import { toAppError } from '@/shared/api/api-error';

const PRESETS = [
  'Photos are unclear or missing rooms',
  'Rent or deposit looks incorrect',
  'Location pin does not match the address',
  'Description has contact details or links',
  'Duplicate listing',
];

/** Admin review of a single listing: the public page + Approve / Reject, or Feature / pin when live. */
export default function ReviewListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { data: listing, isLoading } = useAdminListingQuery(id);
  const [approve, approveState] = useApproveListingMutation();
  const [reject, rejectState] = useRejectListingMutation();
  const [rejecting, setRejecting] = useState(false);
  const [pinning, setPinning] = useState(false);

  const run = async (work: Promise<unknown>, done: string) => {
    try {
      await work;
      toast.show(done);
      router.back();
    } catch (e) {
      toast.show(toAppError(e).message);
    }
  };

  if (isLoading) {
    return (
      <Screen edges={['bottom']}>
        <VStack flex={1} align="center" justify="center">
          <Loader />
        </VStack>
      </Screen>
    );
  }
  if (!listing)
    return (
      <Screen edges={['bottom']}>
        <EmptyState title="Listing not found" />
      </Screen>
    );

  const reviewable = listing.status === 'pending_approval';

  return (
    <>
      <Stack.Screen options={{ title: 'Review listing' }} />
      <ListingDetailView
        listing={listing}
        showStatus
        footer={
          reviewable ? (
            <HStack gap="sm">
              <View style={{ flex: 1 }}>
                <Button label="Reject" variant="outlined" onPress={() => setRejecting(true)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Approve"
                  loading={approveState.isLoading}
                  onPress={() =>
                    void run(approve(listing.id).unwrap(), 'Approved: listing is live')
                  }
                />
              </View>
            </HStack>
          ) : listing.status === 'live' ? (
            <Button
              label={listing.isFeatured ? 'Extend featured / pin' : 'Feature or pin'}
              variant="tonal"
              onPress={() => setPinning(true)}
            />
          ) : undefined
        }
      />
      <PinListingSheet
        listingId={listing.id}
        visible={pinning}
        onDismiss={() => setPinning(false)}
      />
      <RejectSheet
        visible={rejecting}
        title="Reject listing"
        presets={PRESETS}
        loading={rejectState.isLoading}
        onDismiss={() => setRejecting(false)}
        onSubmit={(reason) => {
          setRejecting(false);
          void run(
            reject({ id: listing.id, reason }).unwrap(),
            'Rejected: the lister has been told why',
          );
        }}
      />
    </>
  );
}
