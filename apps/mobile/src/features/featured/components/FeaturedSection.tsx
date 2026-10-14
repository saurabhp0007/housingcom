import { AppText, VStack, useTheme } from '@housingcom/ui';
import { router } from 'expo-router';
import { FlatList, useWindowDimensions } from 'react-native';
import { FavoriteButton } from '@/features/engagement/components/FavoriteButton';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { useFeaturedListingsQuery } from '../featured.api';

/** "Featured in your area" on Home (PRD §6). The server picks and rotates them fairly. */
export function FeaturedSection({ lat, lng }: { lat: number; lng: number }) {
  const { spacing } = useTheme();
  const { width } = useWindowDimensions();
  const { data } = useFeaturedListingsQuery({ lat, lng }, { refetchOnFocus: true });
  if (!data?.length) return null;

  return (
    <VStack gap="md">
      <AppText variant="heading">Featured in your area</AppText>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(l) => l.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={width * 0.78 + spacing.md}
        decelerationRate="fast"
        style={{ marginHorizontal: -spacing.lg }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
        renderItem={({ item }) => (
          <VStack style={{ width: width * 0.78 }}>
            <ListingCard
              listing={item}
              onPress={() => router.push(`/listing/${item.id}`)}
              accessory={<FavoriteButton listingId={item.id} />}
            />
          </VStack>
        )}
      />
    </VStack>
  );
}
