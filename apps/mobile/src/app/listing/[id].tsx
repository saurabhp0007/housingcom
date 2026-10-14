import { Button, EmptyState, HStack, Loader, Screen, VStack } from '@housingcom/ui';
import { formatInr } from '@housingcom/utils';
import * as Linking from 'expo-linking';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Share, View } from 'react-native';
import { ListingDetailView } from '@/features/listings/components/ListingDetailView';
import { useListingQuery } from '@/features/listings/listings.api';
import { useSession } from '@/features/auth/hooks/useSession';
import { ContactSheet } from '@/features/engagement/components/ContactSheet';
import { FavoriteButton } from '@/features/engagement/components/FavoriteButton';
import { ReportSheet } from '@/features/engagement/components/ReportSheet';
import { ReviewsSection } from '@/features/engagement/components/ReviewsSection';
import { VisitSheet } from '@/features/engagement/components/VisitSheet';
import { SimilarListings } from '@/features/search/components/SimilarListings';
import { useTrackShareMutation } from '@/features/search/search.api';

/** Public listing page (deep link: housing://listing/<id>). */
export default function ListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated } = useSession();
  const [sheet, setSheet] = useState<'contact' | 'visit' | 'report' | null>(null);
  const { data: listing, isLoading, isError, refetch } = useListingQuery(id);
  const [trackShare] = useTrackShareMutation();

  if (isLoading) {
    return (
      <Screen edges={['bottom']}>
        <VStack flex={1} align="center" justify="center">
          <Loader />
        </VStack>
      </Screen>
    );
  }

  if (isError || !listing) {
    return (
      <Screen edges={['bottom']}>
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
  const isLive = listing.status === 'live';
  /** Guests sign in first; everything below needs an account. */
  const open = (which: 'contact' | 'visit' | 'report') =>
    isAuthenticated ? setSheet(which) : router.push('/login');
  const share = async () => {
    const result = await Share.share({
      message: `${listing.title} · ${formatInr(listing.rent)}/month in ${listing.areaName ?? ''}\n${Linking.createURL(`/listing/${listing.id}`)}`,
    });
    // A completed share is a strong interest signal for recommendations.
    if (result.action === Share.sharedAction) void trackShare(listing.id);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: listing.areaName ?? 'Listing',
          headerBackTitle: 'Back',
          headerRight: () =>
            isOwner ? null : <FavoriteButton listingId={listing.id} appearance="plain" />,
        }}
      />
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
            <HStack gap="sm" align="center">
              <View style={{ flex: 1 }}>
                <Button label="Share" variant="tonal" onPress={() => void share()} />
              </View>
              {isLive ? (
                <View style={{ flex: 2 }}>
                  <Button label="Contact owner" onPress={() => open('contact')} />
                </View>
              ) : null}
            </HStack>
          )
        }
      >
        {isLive ? <ReviewsSection listingId={listing.id} isOwner={isOwner} /> : null}
        {isLive ? <SimilarListings listingId={listing.id} /> : null}
        {isLive && !isOwner ? (
          <Button
            label="Report this listing"
            variant="text"
            fullWidth={false}
            onPress={() => open('report')}
          />
        ) : null}
      </ListingDetailView>

      {isAuthenticated && !isOwner ? (
        <>
          <ContactSheet
            listing={listing}
            visible={sheet === 'contact'}
            onDismiss={() => setSheet(null)}
            onRequestVisit={() => setSheet('visit')}
          />
          <VisitSheet
            listingId={listing.id}
            visible={sheet === 'visit'}
            onDismiss={() => setSheet(null)}
          />
          <ReportSheet
            listingId={listing.id}
            visible={sheet === 'report'}
            onDismiss={() => setSheet(null)}
          />
        </>
      ) : null}
    </>
  );
}
