import { Button, EmptyState, Loader, Screen, VStack } from '@housingcom/ui';
import { formatInr } from '@housingcom/utils';
import * as Linking from 'expo-linking';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Share } from 'react-native';
import { ListingDetailView } from '@/features/listings/components/ListingDetailView';
import { useListingQuery } from '@/features/listings/listings.api';
import { useSession } from '@/features/auth/hooks/useSession';

/** Public listing page (deep link: housing://listing/<id>). */
export default function ListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const { data: listing, isLoading, isError, refetch } = useListingQuery(id);

  if (isLoading) {
    return (
      <Screen>
        <VStack flex={1} align="center" justify="center">
          <Loader />
        </VStack>
      </Screen>
    );
  }

  if (isError || !listing) {
    return (
      <Screen>
        <EmptyState
          title="Listing unavailable"
          description="It may have been filled, paused or removed."
          actionLabel="Try again"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  const isOwner = user?.id === listing.owner.id;
  const share = () =>
    Share.share({
      message: `${listing.title} · ${formatInr(listing.rent)}/month in ${listing.areaName ?? ''}\n${Linking.createURL(`/listing/${listing.id}`)}`,
    });

  return (
    <>
      <Stack.Screen options={{ title: listing.areaName ?? 'Listing', headerBackTitle: 'Back' }} />
      <ListingDetailView
        listing={listing}
        showStatus={isOwner}
        footer={
          isOwner ? (
            <Button
              label="Edit listing"
              onPress={() => router.push(`/listing-editor/${listing.id}`)}
            />
          ) : (
            <Button label="Share" variant="tonal" onPress={() => void share()} />
          )
        }
      />
    </>
  );
}
