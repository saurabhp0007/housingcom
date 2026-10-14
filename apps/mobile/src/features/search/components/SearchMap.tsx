import type { ListingFilters, MapFeature } from '@housingcom/contracts';
import { AppText, Button, Loader, Sheet, VStack, useTheme } from '@housingcom/ui';
import { formatRentCompact } from '@housingcom/utils';
import { router } from 'expo-router';
import { skipToken } from '@reduxjs/toolkit/query';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { useListingQuery } from '@/features/listings/listings.api';
import { AppMap, type AppMapHandle, type LatLng } from '@/shared/components/map/AppMap';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useMapListingsQuery } from '../search.api';

const INITIAL_ZOOM = 14;

/** Web-mercator approximation: degrees per screen point at a zoom level. */
function boundsFor(center: LatLng, zoom: number, width: number, height: number) {
  const lngPerPt = 360 / (256 * 2 ** zoom);
  const latPerPt = lngPerPt * Math.cos((center.lat * Math.PI) / 180);
  // 20% padding so pins just outside the edges are already loaded when panning.
  const halfW = (width / 2) * lngPerPt * 1.2;
  const halfH = (height / 2) * latPerPt * 1.2;
  return {
    minLat: Math.max(-90, center.lat - halfH),
    maxLat: Math.min(90, center.lat + halfH),
    minLng: Math.max(-180, center.lng - halfW),
    maxLng: Math.min(180, center.lng + halfW),
  };
}

interface SearchMapProps {
  center: LatLng;
  filters: ListingFilters;
}

/** Listings as pins (area-wise clusters when zoomed out); tap a pin for a preview card. */
export function SearchMap({ center, filters }: SearchMapProps) {
  const { colors, spacing } = useTheme();
  const mapRef = useRef<AppMapHandle>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [camera, setCamera] = useState({ center, zoom: INITIAL_ZOOM });
  const settled = useDebouncedValue(camera, 450);
  const [selected, setSelected] = useState<string | null>(null);

  const bbox = size.width ? boundsFor(settled.center, settled.zoom, size.width, size.height) : null;
  const { data, isFetching } = useMapListingsQuery(bbox ? { filters, ...bbox } : skipToken);

  const features = useMemo(() => data?.features ?? [], [data]);
  const byId = useMemo(() => new Map(features.map((f) => [f.id, f])), [features]);

  const markers = features.map((f: MapFeature) => ({
    id: f.id,
    ...f.location,
    title:
      f.kind === 'listing'
        ? formatRentCompact(f.rent)
        : `${f.count} places · from ${formatRentCompact(f.minRent)}`,
  }));

  const onMarkerPress = (id: string) => {
    const feature = byId.get(id);
    if (!feature) return;
    if (feature.kind === 'cluster') {
      // Zoom into the cluster; the refetch at the new zoom splits it into pins.
      mapRef.current?.moveTo(feature.location, Math.min(settled.zoom + 2, 18));
    } else {
      setSelected(feature.id);
    }
  };

  return (
    <View style={styles.fill} onLayout={(e: LayoutChangeEvent) => setSize(e.nativeEvent.layout)}>
      <AppMap
        ref={mapRef}
        style={styles.fill}
        initialCenter={center}
        initialZoom={INITIAL_ZOOM}
        markers={markers}
        showsUserLocation
        onCameraMove={(c, zoom) => setCamera({ center: c, zoom })}
        onMarkerPress={onMarkerPress}
      />
      <View
        pointerEvents="none"
        style={[styles.badge, { backgroundColor: colors.surface, top: spacing.md }]}
      >
        {isFetching ? (
          <Loader />
        ) : (
          <AppText variant="label">
            {data
              ? `${data.total} place${data.total === 1 ? '' : 's'} in view`
              : 'Move the map to explore'}
          </AppText>
        )}
      </View>
      <PinPreview listingId={selected} onDismiss={() => setSelected(null)} />
    </View>
  );
}

function PinPreview({ listingId, onDismiss }: { listingId: string | null; onDismiss: () => void }) {
  const { data, isFetching } = useListingQuery(listingId ?? '', { skip: !listingId });
  return (
    <Sheet visible={!!listingId} onDismiss={onDismiss}>
      {isFetching || !data ? (
        <VStack align="center" padding="xl">
          <Loader />
        </VStack>
      ) : (
        <VStack gap="md">
          <ListingCard
            listing={data}
            onPress={() => {
              onDismiss();
              router.push(`/listing/${data.id}`);
            }}
          />
          <Button
            label="View details"
            onPress={() => {
              onDismiss();
              router.push(`/listing/${data.id}`);
            }}
          />
        </VStack>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  badge: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
