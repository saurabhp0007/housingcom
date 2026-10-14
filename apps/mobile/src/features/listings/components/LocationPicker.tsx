import { AppText, Button, HStack, Loader, VStack, useTheme } from '@housingcom/ui';
import type { Coordinates } from '@housingcom/contracts';
import * as Location from 'expo-location';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { useResolveLocationQuery } from '@/features/location/geo.api';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useAppSelector } from '@/shared/store/hooks';

const DEFAULT_CENTER: Coordinates = { lat: 12.9716, lng: 77.5946 };

interface LocationPickerProps {
  value: Coordinates | null;
  onChange: (coords: Coordinates) => void;
  /** Called with a human address from the platform geocoder (free; no API key). */
  onAddress?: (address: string) => void;
  /** Show the resolved area and whether it is serviceable (listings), or not (admin geo). */
  showServiceability?: boolean;
  height?: number;
}

const toRegion = ({ lat, lng }: Coordinates): Region => ({
  latitude: lat,
  longitude: lng,
  latitudeDelta: 0.008,
  longitudeDelta: 0.008,
});

/** Drag the map under a fixed centre pin, the standard pattern for precise placement. */
export function LocationPicker({
  value,
  onChange,
  onAddress,
  showServiceability = true,
  height = 260,
}: LocationPickerProps) {
  const { colors, radius } = useTheme();
  const mapRef = useRef<MapView>(null);
  const fallback = useAppSelector((s) => s.location.selected?.coords) ?? DEFAULT_CENTER;
  const [center, setCenter] = useState<Coordinates>(value ?? fallback);
  const [locating, setLocating] = useState(false);
  const settled = useDebouncedValue(center, 500);

  const { data: resolved, isFetching } = useResolveLocationQuery(settled, {
    skip: !showServiceability,
  });

  useEffect(() => {
    onChange(settled);
    if (!onAddress) return;
    void Location.reverseGeocodeAsync({ latitude: settled.lat, longitude: settled.lng })
      .then(([place]) => {
        if (!place) return;
        const line = [place.name, place.street, place.district, place.city]
          .filter(Boolean)
          .join(', ');
        if (line) onAddress(line);
      })
      .catch(() => undefined);
    // onChange/onAddress are callbacks from the parent; re-running on their identity is not wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled]);

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      mapRef.current?.animateToRegion(toRegion(next), 400);
      setCenter(next);
    } finally {
      setLocating(false);
    }
  };

  return (
    <VStack gap="sm">
      <View style={{ height, borderRadius: radius.lg, overflow: 'hidden' }}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={toRegion(center)}
          onRegionChangeComplete={(r) => setCenter({ lat: r.latitude, lng: r.longitude })}
          showsUserLocation
          toolbarEnabled={false}
        />
        {/* Fixed centre pin; its tip marks the exact point. */}
        <View pointerEvents="none" style={styles.pinWrap}>
          <SymbolView
            name={{ ios: 'mappin.circle.fill', android: 'location_on' }}
            size={40}
            tintColor={colors.primary}
          />
        </View>
      </View>

      <HStack justify="space-between" align="center" gap="sm">
        {showServiceability ? (
          <HStack gap="xs" align="center" flex={1}>
            {isFetching ? <Loader /> : null}
            <AppText
              variant="caption"
              color={resolved && !resolved.isServiceable ? 'danger' : 'textSecondary'}
              numberOfLines={2}
            >
              {isFetching
                ? 'Checking area…'
                : resolved?.isServiceable
                  ? `${resolved.area?.name}, ${resolved.city?.name}`
                  : "We don't operate here yet. Move the pin to a supported city."}
            </AppText>
          </HStack>
        ) : (
          <AppText variant="caption" color="textSecondary">
            {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
          </AppText>
        )}
        <Button
          label="My location"
          variant="text"
          fullWidth={false}
          loading={locating}
          onPress={useMyLocation}
        />
      </HStack>
    </VStack>
  );
}

const styles = StyleSheet.create({
  pinWrap: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -20,
    marginTop: -40,
  },
});
