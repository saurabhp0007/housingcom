import type { Ref } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface AppMapMarker extends LatLng {
  id: string;
  /** Shown on the pin's callout, e.g. "₹9k" or "12 places". */
  title?: string;
}

export interface AppMapHandle {
  /** Animates the camera to a point. */
  moveTo(center: LatLng, zoom?: number): void;
}

export interface AppMapProps {
  ref?: Ref<AppMapHandle>;
  /** Initial camera centre. Use the ref to move the camera afterwards. */
  initialCenter: LatLng;
  initialZoom?: number;
  markers?: AppMapMarker[];
  /** false = static preview (no gestures), e.g. on the listing page. */
  interactive?: boolean;
  showsUserLocation?: boolean;
  /** Fires while the camera moves (centre + zoom level); debounce on the consumer side. */
  onCameraMove?: (center: LatLng, zoom: number) => void;
  onMarkerPress?: (markerId: string) => void;
  style?: StyleProp<ViewStyle>;
}
