import { AppText, VStack, useTheme } from '@housingcom/ui';
import { router } from 'expo-router';
import { FlatList, View } from 'react-native';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { useSimilarListingsQuery } from '../search.api';

/** "Similar listings nearby" carousel on the listing page (PRD §3). */
export function SimilarListings({ listingId }: { listingId: string }) {
  const { spacing } = useTheme();
  const { data } = useSimilarListingsQuery(listingId);
  if (!data?.length) return null;

  return (
    <VStack gap="sm">
      <AppText variant="heading">Similar places nearby</AppText>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(l) => l.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.md }}
        renderItem={({ item }) => (
          <View style={{ width: 260 }}>
            <ListingCard listing={item} onPress={() => router.push(`/listing/${item.id}`)} />
          </View>
        )}
      />
    </VStack>
  );
}
