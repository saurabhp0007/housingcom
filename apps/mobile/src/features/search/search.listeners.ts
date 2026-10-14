import { isAnyOf } from '@reduxjs/toolkit';
import { persistedState } from '@/shared/storage/persisted-state';
import { startAppListening } from '@/shared/store/listener';
import { centerChosen, filtersApplied, recentCleared, sortChanged } from './search.slice';

export const SEARCH_STORAGE_KEY = 'search.prefs';

/** Persists filters, sort and recent searches across launches. */
export function registerSearchListeners(): void {
  startAppListening({
    matcher: isAnyOf(filtersApplied, sortChanged, centerChosen, recentCleared),
    effect: (_action, api) => {
      const { filters, sort, recent } = api.getState().search;
      void persistedState.save(SEARCH_STORAGE_KEY, { filters, sort, recent });
    },
  });
}
