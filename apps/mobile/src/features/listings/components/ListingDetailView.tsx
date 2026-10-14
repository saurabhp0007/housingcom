import { AppText, Button, Card, HStack, Pill, VStack, useTheme, Icon } from '@housingcom/ui';
import {
  AMENITY_LABELS,
  NEARBY_PLACE_LABELS,
  type ListingDetailResponse,
} from '@housingcom/contracts';
import { formatDistance, formatInr } from '@housingcom/utils';
import type { ReactNode } from 'react';
import * as Linking from 'expo-linking';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppMap } from '@/shared/components/map/AppMap';
import { STATUS_META, listingTagline } from '../listing-labels';
import { ListingGallery } from './ListingGallery';

interface ListingDetailViewProps {
  listing: ListingDetailResponse;
  /** Shows the status banner (owner / admin views). */
  showStatus?: boolean;
  /** Pinned action bar (e.g. approve/reject, share). */
  footer?: ReactNode;
  /** Extra sections at the end of the page (e.g. similar listings). */
  children?: ReactNode;
}

const NEARBY_SYMBOLS = {
  metro: 'train',
  bus_stop: 'bus',
  college: 'school',
  hospital: 'medkit',
} as const;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Opens turn-by-turn directions in the phone's Maps app (Apple Maps / Google Maps app), not a website. */
function openDirections(lat: number, lng: number, label: string) {
  const url =
    Platform.OS === 'ios'
      ? `maps://?daddr=${lat},${lng}&dirflg=d`
      : `google.navigation:q=${lat},${lng}`;
  // Fallback: the generic geo: intent lets the user pick any installed maps app.
  void Linking.openURL(url).catch(() =>
    Linking.openURL(`geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`),
  );
}

/** The listing page body, shared by the public page, the lister preview and admin review. */
export function ListingDetailView({
  listing: l,
  showStatus,
  footer,
  children,
}: ListingDetailViewProps) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const status = STATUS_META[l.status];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: (footer ? 96 : 24) + insets.bottom }}>
        <ListingGallery media={l.media} />
        <VStack gap="lg" style={{ padding: spacing.lg }}>
          {showStatus ? (
            <Card tone={l.status === 'rejected' ? 'muted' : 'surface'}>
              <VStack gap="xs">
                <Pill label={status.label} tone={status.tone} />
                {l.rejectionReason ? <AppText color="danger">{l.rejectionReason}</AppText> : null}
                {l.viewCount !== undefined ? (
                  <AppText variant="caption" color="textSecondary">
                    {l.viewCount} views · {l.contactCount ?? 0} contacts
                  </AppText>
                ) : null}
              </VStack>
            </Card>
          ) : null}

          <VStack gap="xs">
            <HStack gap="xs" wrap>
              {l.isFeatured ? <Pill label="Featured" tone="featured" /> : null}
              {l.isVerifiedLister ? <Pill label="Verified lister" tone="verified" /> : null}
              {l.foodIncluded ? <Pill label="Food included" tone="success" /> : null}
            </HStack>
            <AppText variant="title">{l.title}</AppText>
            <AppText color="textSecondary">
              {[l.areaName, l.cityName].filter(Boolean).join(', ')}
            </AppText>
          </VStack>

          <Card>
            <HStack justify="space-between" align="center">
              <VStack gap="xxs">
                <AppText variant="caption" color="textSecondary">
                  Rent
                </AppText>
                <AppText variant="heading">{formatInr(l.rent)}/mo</AppText>
              </VStack>
              <VStack gap="xxs">
                <AppText variant="caption" color="textSecondary">
                  Deposit
                </AppText>
                <AppText variant="heading">
                  {l.deposit != null ? formatInr(l.deposit) : '—'}
                </AppText>
              </VStack>
              <VStack gap="xxs">
                <AppText variant="caption" color="textSecondary">
                  Available
                </AppText>
                <AppText variant="heading">
                  {l.availableFrom ? formatDate(l.availableFrom) : '—'}
                </AppText>
              </VStack>
            </HStack>
          </Card>

          <AppText variant="bodyStrong">{listingTagline(l)}</AppText>

          {l.description ? (
            <VStack gap="xs">
              <AppText variant="heading">About this place</AppText>
              <AppText color="textSecondary">{l.description}</AppText>
            </VStack>
          ) : null}

          {l.amenities.length > 0 ? (
            <VStack gap="sm">
              <AppText variant="heading">Amenities</AppText>
              <HStack gap="xs" wrap>
                {l.amenities.map((a) => (
                  <Pill key={a} label={AMENITY_LABELS[a]} />
                ))}
              </HStack>
            </VStack>
          ) : null}

          {l.houseRules ? (
            <VStack gap="xs">
              <AppText variant="heading">House rules</AppText>
              <AppText color="textSecondary">{l.houseRules}</AppText>
            </VStack>
          ) : null}

          {l.location ? (
            <VStack gap="sm">
              <AppText variant="heading">Location</AppText>
              {l.address ? <AppText color="textSecondary">{l.address}</AppText> : null}
              <View style={{ borderRadius: radius.lg, overflow: 'hidden' }}>
                <AppMap
                  style={styles.map}
                  interactive={false}
                  initialCenter={l.location}
                  markers={[{ id: l.id, ...l.location, title: l.title }]}
                />
              </View>
              <Button
                label="Get directions"
                variant="tonal"
                fullWidth={false}
                onPress={() => openDirections(l.location!.lat, l.location!.lng, l.title)}
              />
            </VStack>
          ) : null}

          {l.nearbyPlaces.length > 0 ? (
            <VStack gap="sm">
              <AppText variant="heading">Nearby</AppText>
              {l.nearbyPlaces.map((p) => (
                <HStack key={p.category} gap="sm" align="center">
                  <Icon name={NEARBY_SYMBOLS[p.category]} size={20} color={colors.primary} />
                  <VStack flex={1} gap="xxs">
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {p.name}
                    </AppText>
                    <AppText variant="caption" color="textSecondary">
                      {NEARBY_PLACE_LABELS[p.category]}
                    </AppText>
                  </VStack>
                  <AppText variant="caption" color="textSecondary">
                    {formatDistance(p.distanceKm)}
                  </AppText>
                </HStack>
              ))}
            </VStack>
          ) : null}

          <Card>
            <VStack gap="xxs">
              <AppText variant="caption" color="textSecondary">
                Listed by
              </AppText>
              <HStack gap="xs" align="center">
                <AppText variant="bodyStrong">{l.owner.name ?? 'Owner'}</AppText>
                {l.owner.isVerified ? <Pill label="Verified" tone="verified" /> : null}
              </HStack>
              <AppText variant="caption" color="textSecondary">
                Member since {formatDate(l.owner.memberSince)}
              </AppText>
            </VStack>
          </Card>
          {children}
        </VStack>
      </ScrollView>

      {footer ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: 180 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
