import { Button, EmptyState, Loader, Screen, VStack } from '@housingcom/ui';
import { formatInr } from '@housingcom/utils';
import * as Linking from 'expo-linking';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Share } from 'react-native';
import { ListingDetailView } from '@/features/listings/components/ListingDetailView';
import { useListingQuery } from '@/features/listings/listings.api';
import { useSession } from '@/features/auth/hooks/useSession';
import { SimilarListings } from '@/features/search/components/SimilarListings';
import { useTrackShareMutation } from '@/features/search/search.api';

/** Public listing page (deep link: housing://listing/<id>). */
export default function ListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const { data: listing, isLoading, isError, refetch } = useListingQuery(id);
  const [trackShare] = useTrackShareMutation();

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
  const share = async () => {
    const result = await Share.share({
      message: `${listing.title} · ${formatInr(listing.rent)}/month in ${listing.areaName ?? ''}\n${Linking.createURL(`/listing/${listing.id}`)}`,
    });
    // A completed share is a strong interest signal for recommendations.
    if (result.action === Share.sharedAction) void trackShare(listing.id);
  };

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
      >
        {listing.status === 'live' ? <SimilarListings listingId={listing.id} /> : null}
      </ListingDetailView>
    </>
  );
}
