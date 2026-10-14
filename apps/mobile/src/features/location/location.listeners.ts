import { persistedState } from '@/shared/storage/persisted-state';
import { startAppListening } from '@/shared/store/listener';
import { locationSelected } from './location.slice';

export const LOCATION_STORAGE_KEY = 'location.selected';

/** Remembers the last chosen location across launches. */
export function registerLocationListeners(): void {
  startAppListening({
    actionCreator: locationSelected,
    effect: (action) => persistedState.save(LOCATION_STORAGE_KEY, action.payload),
  });
}
