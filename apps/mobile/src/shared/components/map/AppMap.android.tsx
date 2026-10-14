import { useImage } from 'expo-image';
import { GoogleMaps } from 'expo-maps';
import { useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '@housingcom/ui';
import type { AppMapProps } from './types';

/** Google Maps (Android) via expo-maps. */
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
  const { scheme } = useTheme();
  // Google Maps markers can't be tinted, so featured pins use a bundled icon.
  const featuredPin = useImage(require('../../../../assets/map-pin-featured.png'));
  const map = useRef<GoogleMaps.MapView>(null);
  const [camera] = useState(() => ({
    coordinates: { latitude: initialCenter.lat, longitude: initialCenter.lng },
    zoom: initialZoom,
  }));

  useImperativeHandle(ref, () => ({
    moveTo: (c, zoom) =>
      map.current?.setCameraPosition({
        coordinates: { latitude: c.lat, longitude: c.lng },
        zoom: zoom ?? initialZoom,
        duration: 400,
      }),
  }));

  return (
    <View style={style} pointerEvents={interactive ? 'auto' : 'none'}>
      <GoogleMaps.View
        ref={map}
        style={{ flex: 1 }}
        cameraPosition={camera}
        colorScheme={
          scheme === 'dark' ? GoogleMaps.MapColorScheme.DARK : GoogleMaps.MapColorScheme.LIGHT
        }
        markers={markers.map((m) => ({
          id: m.id,
          title: m.title,
          coordinates: { latitude: m.lat, longitude: m.lng },
          ...(m.highlighted && featuredPin ? { icon: featuredPin } : {}),
        }))}
        properties={{ isMyLocationEnabled: showsUserLocation, selectionEnabled: false }}
        uiSettings={{
          myLocationButtonEnabled: false,
          mapToolbarEnabled: false,
          zoomControlsEnabled: false,
          scrollGesturesEnabled: interactive,
          zoomGesturesEnabled: interactive,
          rotationGesturesEnabled: false,
          tiltGesturesEnabled: false,
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
