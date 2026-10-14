import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import * as Linking from 'expo-linking';
import { useAppDispatch } from '@/shared/store/hooks';
import { useLazyResolveLocationQuery } from '../geo.api';
import { locationSelected, permissionChanged } from '../location.slice';

export type DetectResult = 'ok' | 'denied' | 'unserviceable' | 'error';

/**
 * Permission → position → nearest serviceable area, in one call.
 * Uses the last known fix first (instant), then a balanced-accuracy fix if needed.
 */
export function useDetectLocation() {
  const dispatch = useAppDispatch();
  const [resolve] = useLazyResolveLocationQuery();
  const [detecting, setDetecting] = useState(false);

  const detect = useCallback(async (): Promise<DetectResult> => {
    setDetecting(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      dispatch(permissionChanged(permission.granted ? 'granted' : 'denied'));
      if (!permission.granted) return 'denied';

      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000, requiredAccuracy: 500 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      const coords = { lat: position.coords.latitude, lng: position.coords.longitude };

      const resolved = await resolve(coords).unwrap();
      if (!resolved.isServiceable || !resolved.area) return 'unserviceable';

      dispatch(
        locationSelected({
          label: resolved.area.name,
          coords,
          cityId: resolved.city?.id ?? null,
          areaId: resolved.area.id,
          source: 'gps',
        }),
      );
      return 'ok';
    } catch {
      return 'error';
    } finally {
      setDetecting(false);
    }
  }, [dispatch, resolve]);

  const openSettings = useCallback(() => Linking.openSettings(), []);

  return { detect, detecting, openSettings };
}
