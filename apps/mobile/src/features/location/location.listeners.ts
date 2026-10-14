import { authApi } from '@/features/auth/auth.api';
import { persistedState } from '@/shared/storage/persisted-state';
import { startAppListening } from '@/shared/store/listener';
import { userUpdated } from '@/shared/store/session.slice';
import { locationSelected } from './location.slice';

export const LOCATION_STORAGE_KEY = 'location.selected';

/** Remembers the last chosen location across launches. */
export function registerLocationListeners(): void {
  startAppListening({
    actionCreator: locationSelected,
    effect: (action) => persistedState.save(LOCATION_STORAGE_KEY, action.payload),
  });

  // The server targets city announcements by the user's preferred city.
  startAppListening({
    actionCreator: locationSelected,
    effect: async (action, api) => {
      const { session } = api.getState();
      const cityId = action.payload.cityId;
      if (session.status !== 'authenticated' || !cityId || session.user?.preferredCityId === cityId)
        return;
      const result = await api.dispatch(
        authApi.endpoints.updateMe.initiate({ preferredCityId: cityId }),
      );
      if (result.data) api.dispatch(userUpdated(result.data));
    },
  });
}
