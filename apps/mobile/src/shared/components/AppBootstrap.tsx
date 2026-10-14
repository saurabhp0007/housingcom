import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { sessionService } from '@/features/auth/services/session.service';
import { useChatRealtime } from '@/features/chat/hooks/useChatRealtime';
import { usePushNotifications } from '@/features/notifications/hooks/usePushNotifications';
import { UpdatingOverlay } from '@/features/app-updates/components/UpdatingOverlay';
import { useOtaUpdates } from '@/features/app-updates/hooks/useOtaUpdates';
import {
  LOCATION_STORAGE_KEY,
  registerLocationListeners,
} from '@/features/location/location.listeners';
import { locationHydrated, type SelectedLocation } from '@/features/location/location.slice';
import { SEARCH_STORAGE_KEY, registerSearchListeners } from '@/features/search/search.listeners';
import { searchHydrated, type SearchState } from '@/features/search/search.slice';
import { persistedState } from '../storage/persisted-state';
import { useAppDispatch } from '../store/hooks';

void SplashScreen.preventAutoHideAsync();
registerLocationListeners();
registerSearchListeners();

/** Restores persisted state + session behind the splash screen, then starts OTA checks. */
export function AppBootstrap({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);
  const { applyingCritical } = useOtaUpdates();

  useEffect(() => {
    void (async () => {
      const [location, search] = await Promise.all([
        persistedState.load<SelectedLocation>(LOCATION_STORAGE_KEY),
        persistedState.load<Pick<SearchState, 'filters' | 'sort' | 'recent'>>(SEARCH_STORAGE_KEY),
        sessionService.restore(dispatch),
      ]);
      dispatch(locationHydrated(location));
      dispatch(searchHydrated(search));
      setReady(true);
      await SplashScreen.hideAsync();
    })();
  }, [dispatch]);

  if (!ready) return null;
  return (
    <>
      {children}
      <SessionServices />
      {applyingCritical ? <UpdatingOverlay /> : null}
    </>
  );
}

/** Signed-in background services: real-time chat and push notifications. */
function SessionServices() {
  useChatRealtime();
  usePushNotifications();
  return null;
}
