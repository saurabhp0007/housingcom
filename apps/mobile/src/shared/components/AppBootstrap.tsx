import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { sessionService } from '@/features/auth/services/session.service';
import { UpdatingOverlay } from '@/features/app-updates/components/UpdatingOverlay';
import { useOtaUpdates } from '@/features/app-updates/hooks/useOtaUpdates';
import {
  LOCATION_STORAGE_KEY,
  registerLocationListeners,
} from '@/features/location/location.listeners';
import { locationHydrated, type SelectedLocation } from '@/features/location/location.slice';
import { persistedState } from '../storage/persisted-state';
import { useAppDispatch } from '../store/hooks';

void SplashScreen.preventAutoHideAsync();
registerLocationListeners();

/** Restores persisted state + session behind the splash screen, then starts OTA checks. */
export function AppBootstrap({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);
  const { applyingCritical } = useOtaUpdates();

  useEffect(() => {
    void (async () => {
      const [location] = await Promise.all([
        persistedState.load<SelectedLocation>(LOCATION_STORAGE_KEY),
        sessionService.restore(dispatch),
      ]);
      dispatch(locationHydrated(location));
      setReady(true);
      await SplashScreen.hideAsync();
    })();
  }, [dispatch]);

  if (!ready) return null;
  return (
    <>
      {children}
      {applyingCritical ? <UpdatingOverlay /> : null}
    </>
  );
}
