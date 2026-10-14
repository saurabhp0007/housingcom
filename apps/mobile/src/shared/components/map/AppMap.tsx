import { AppleMaps } from 'expo-maps';
import { useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '@housingcom/ui';
import type { AppMapProps } from './types';

/** Apple Maps (iOS) via expo-maps. No Google key or SDK needed on iOS. */
export function AppMap({
  ref,
  initialCenter,
  initialZoom = 15,
  markers = [],
  interactive = true,
  showsUserLocation = false,
  onCameraMove,
  onMarkerPress,
  style,
}: AppMapProps) {
  const { colors } = useTheme();
  const map = useRef<AppleMaps.MapView>(null);
  const [camera] = useState(() => ({
    coordinates: { latitude: initialCenter.lat, longitude: initialCenter.lng },
    zoom: initialZoom,
  }));

  useImperativeHandle(ref, () => ({
    moveTo: (c, zoom) =>
      map.current?.setCameraPosition({
        coordinates: { latitude: c.lat, longitude: c.lng },
        zoom: zoom ?? initialZoom,
      }),
  }));

  return (
    // Apple Maps has no per-gesture switches, so static previews simply ignore touches.
    <View style={style} pointerEvents={interactive ? 'auto' : 'none'}>
      <AppleMaps.View
        ref={map}
        style={{ flex: 1 }}
        cameraPosition={camera}
        markers={markers.map((m) => ({
          id: m.id,
          title: m.title,
          tintColor: colors.primary,
          coordinates: { latitude: m.lat, longitude: m.lng },
        }))}
        properties={{ isMyLocationEnabled: showsUserLocation, selectionEnabled: false }}
        uiSettings={{
          myLocationButtonEnabled: false,
          compassEnabled: false,
          togglePitchEnabled: false,
        }}
        onMarkerClick={(m) => m.id && onMarkerPress?.(m.id)}
        onCameraMove={(e) =>
          e.coordinates.latitude !== undefined &&
          e.coordinates.longitude !== undefined &&
          onCameraMove?.({ lat: e.coordinates.latitude, lng: e.coordinates.longitude }, e.zoom)
        }
      />
    </View>
  );
}

export type { AppMapHandle, AppMapMarker, AppMapProps, LatLng } from './types';
