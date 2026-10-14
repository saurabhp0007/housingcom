import * as Location from 'expo-location';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useTheme } from '@housingcom/ui';
import type { AppMapMarker, AppMapProps, LatLng } from './types';

const LEAFLET = 'https://unpkg.com/leaflet@1.9.4/dist';

/** CARTO basemaps over OpenStreetMap data: clean, keyless, light and dark variants. */
const tilesFor = (scheme: 'light' | 'dark') =>
  `https://{s}.basemaps.cartocdn.com/${scheme === 'dark' ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`;

type MapMessage =
  | { type: 'ready' }
  | { type: 'move'; lat: number; lng: number; zoom: number }
  | { type: 'marker'; id: string };

interface PinColors {
  pin: string;
  featured: string;
  user: string;
}

function mapHtml(center: LatLng, zoom: number, interactive: boolean, tiles: string, c: PinColors) {
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="${LEAFLET}/leaflet.css">
<style>
html,body,#map{margin:0;height:100%;background:transparent}
.leaflet-control-attribution{font-size:9px}
.pin{width:28px;height:28px}
.me{width:16px;height:16px;border-radius:8px;background:${c.user};border:3px solid #fff;box-shadow:0 0 0 6px ${c.user}33;box-sizing:border-box}
</style>
<script src="${LEAFLET}/leaflet.js"></script>
</head><body><div id="map"></div><script>
var post = function (m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
var map = L.map('map', {
  zoomControl: false,
  attributionControl: true,
  dragging: ${interactive},
  touchZoom: ${interactive},
  doubleClickZoom: ${interactive},
  scrollWheelZoom: false,
  boxZoom: false,
  keyboard: false,
}).setView([${center.lat}, ${center.lng}], ${zoom});
L.tileLayer('${tiles}', {
  maxZoom: 20,
  subdomains: 'abcd',
  attribution: '&copy; OpenStreetMap &copy; CARTO',
}).addTo(map);
var pin = function (color) {
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -26],
    html: '<svg class="pin" viewBox="0 0 24 24"><path fill="' + color + '" stroke="#fff" stroke-width="1.5" d="M12 1.5a7.5 7.5 0 0 0-7.5 7.5c0 5.6 7.5 13.5 7.5 13.5s7.5-7.9 7.5-13.5A7.5 7.5 0 0 0 12 1.5z"/><circle cx="12" cy="9" r="2.8" fill="#fff"/></svg>',
  });
};
var icons = { normal: pin('${c.pin}'), featured: pin('${c.featured}') };
var layer = L.layerGroup().addTo(map);
var me = null;
window.setMarkers = function (markers) {
  layer.clearLayers();
  markers.forEach(function (m) {
    var marker = L.marker([m.lat, m.lng], { icon: m.highlighted ? icons.featured : icons.normal });
    if (m.title) marker.bindPopup(m.title, { closeButton: false });
    marker.on('click', function () { post({ type: 'marker', id: m.id }); });
    marker.addTo(layer);
  });
};
window.setUserLocation = function (p) {
  if (!me) me = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [16, 16] }), interactive: false }).addTo(map);
  else me.setLatLng([p.lat, p.lng]);
};
window.moveTo = function (p, z) { map.flyTo([p.lat, p.lng], z, { duration: 0.4 }); };
map.on('move', function () {
  var c = map.getCenter();
  post({ type: 'move', lat: c.lat, lng: c.lng, zoom: map.getZoom() });
});
post({ type: 'ready' });
</script></body></html>`;
}

/** OpenStreetMap (Leaflet) in a WebView. Same props on iOS and Android, no API key needed. */
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
  const { colors, scheme } = useTheme();
  const web = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [html] = useState(() =>
    mapHtml(initialCenter, initialZoom, interactive, tilesFor(scheme), {
      pin: colors.primary,
      featured: colors.warning,
      user: colors.primary,
    }),
  );

  const run = (script: string) => web.current?.injectJavaScript(`${script};true;`);

  useImperativeHandle(ref, () => ({
    moveTo: (c, zoom) => run(`window.moveTo(${JSON.stringify(c)}, ${zoom ?? initialZoom})`),
  }));

  const markersJson = JSON.stringify(markers satisfies AppMapMarker[]);
  useEffect(() => {
    if (ready) run(`window.setMarkers(${markersJson})`);
  }, [ready, markersJson]);

  useEffect(() => {
    if (!ready || !showsUserLocation) return;
    let cancelled = false;
    void (async () => {
      const { granted } = await Location.getForegroundPermissionsAsync();
      if (!granted) return;
      const pos = await Location.getLastKnownPositionAsync();
      if (pos && !cancelled)
        run(
          `window.setUserLocation(${JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })})`,
        );
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, showsUserLocation]);

  const onMessage = (e: WebViewMessageEvent) => {
    const m = JSON.parse(e.nativeEvent.data) as MapMessage;
    if (m.type === 'ready') setReady(true);
    else if (m.type === 'move') onCameraMove?.({ lat: m.lat, lng: m.lng }, m.zoom);
    else onMarkerPress?.(m.id);
  };

  return (
    <View
      style={[{ backgroundColor: colors.surfaceMuted }, style]}
      pointerEvents={interactive ? 'auto' : 'none'}
    >
      <WebView
        ref={web}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://localhost' }}
        onMessage={onMessage}
        javaScriptEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />
    </View>
  );
}

export type { AppMapHandle, AppMapMarker, AppMapProps, LatLng } from './types';
