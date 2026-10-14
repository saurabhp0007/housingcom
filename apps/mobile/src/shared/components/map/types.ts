import type { Ref } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface AppMapMarker extends LatLng {
  id: string;
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
  /** Fires while the camera moves; debounce on the consumer side. */
  onCameraMove?: (center: LatLng) => void;
  style?: StyleProp<ViewStyle>;
}
