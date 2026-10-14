import { AppText, Button, Card, HStack, Pill, VStack, useTheme } from '@housingcom/ui';
import { AMENITY_LABELS, type ListingDetailResponse } from '@housingcom/contracts';
import { formatInr } from '@housingcom/utils';
import type { ReactNode } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STATUS_META, listingTagline } from '../listing-labels';
import { ListingGallery } from './ListingGallery';

interface ListingDetailViewProps {
  listing: ListingDetailResponse;
  /** Shows the status banner (owner / admin views). */
  showStatus?: boolean;
  /** Pinned action bar (e.g. approve/reject, share). */
  footer?: ReactNode;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function openDirections(lat: number, lng: number) {
  const url =
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?daddr=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  void Linking.openURL(url);
}

/** The listing page body, shared by the public page, the lister preview and admin review. */
export function ListingDetailView({ listing: l, showStatus, footer }: ListingDetailViewProps) {
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
                <MapView
                  style={styles.map}
                  liteMode
                  pointerEvents="none"
                  initialRegion={{
                    latitude: l.location.lat,
                    longitude: l.location.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker
                    coordinate={{ latitude: l.location.lat, longitude: l.location.lng }}
                    pinColor={colors.primary}
                  />
                </MapView>
              </View>
              <Button
                label="Get directions"
                variant="tonal"
                fullWidth={false}
                onPress={() => openDirections(l.location!.lat, l.location!.lng)}
              />
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
