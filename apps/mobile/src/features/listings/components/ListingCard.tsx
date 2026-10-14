import { AppText, HStack, Pill, VStack, useTheme, Icon } from '@housingcom/ui';
import { formatDistance, formatInr } from '@housingcom/utils';
import type { ListingCardResponse } from '@housingcom/contracts';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { TYPE_LABELS, listingTagline } from '../listing-labels';

interface ListingCardProps {
  listing: ListingCardResponse;
  onPress: () => void;
  /** Extra content under the card body (status, stats, actions). */
  footer?: ReactNode;
  badge?: ReactNode;
  /** Top-right of the photo (e.g. the favourite heart). */
  accessory?: ReactNode;
}

/** Image-first card used on Home, search, My listings and admin queues. */
export function ListingCard({ listing, onPress, footer, badge, accessory }: ListingCardProps) {
  const { colors, radius, spacing } = useTheme();
  const place = [listing.areaName, listing.cityName].filter(Boolean).join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${formatInr(listing.rent)} per month, ${place}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View>
        <Image
          source={listing.coverUrl ? { uri: listing.coverUrl } : undefined}
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          contentFit="cover"
          transition={200}
          style={[
            styles.image,
            {
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              backgroundColor: colors.surfaceMuted,
            },
          ]}
        />
        <HStack gap="xs" style={styles.overlay}>
          {listing.isFeatured ? <Pill label="Featured" tone="featured" /> : null}
          <Pill label={TYPE_LABELS[listing.type]} tone="primary" />
          {listing.isVerifiedLister ? <Pill label="Verified" tone="verified" /> : null}
          {badge}
        </HStack>
        {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
      </View>
      <VStack gap="xxs" style={{ padding: spacing.md }}>
        <HStack justify="space-between" align="center">
          <AppText variant="heading">
            {formatInr(listing.rent)}
            <AppText variant="caption" color="textSecondary">
              {' '}
              / month
            </AppText>
          </AppText>
          {listing.distanceKm !== undefined ? (
            <HStack gap="xxs" align="center">
              <Icon name="navigate-outline" size={12} color={colors.textSecondary} />
              <AppText variant="caption" color="textSecondary">
                {formatDistance(listing.distanceKm)}
              </AppText>
            </HStack>
          ) : null}
        </HStack>
        <HStack gap="xs" align="center">
          <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {listing.title}
          </AppText>
          {listing.ratingCount > 0 && listing.ratingAverage !== null ? (
            <HStack gap="xxs" align="center">
              <Icon name="star" size={12} color={colors.warning} />
              <AppText variant="caption">
                {listing.ratingAverage.toFixed(1)} ({listing.ratingCount})
              </AppText>
            </HStack>
          ) : null}
        </HStack>
        <AppText variant="caption" color="textSecondary" numberOfLines={1}>
          {listingTagline(listing)}
          {listing.foodIncluded ? ' · Food included' : ''}
        </AppText>
        {place ? (
          <AppText variant="caption" color="textSecondary" numberOfLines={1}>
            {place}
          </AppText>
        ) : null}
        {footer}
      </VStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 16 / 10 },
  overlay: { position: 'absolute', top: 10, left: 10 },
  accessory: { position: 'absolute', top: 6, right: 6 },
});
