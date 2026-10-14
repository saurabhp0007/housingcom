import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { ListingSort, type Coordinates, type ListingFilters } from '@housingcom/contracts';

export interface SearchCenter {
  label: string;
  /** e.g. "Bengaluru" or a Google address line. */
  subtitle: string | null;
  coords: Coordinates;
}

export type SearchView = 'list' | 'map';

export interface SearchState {
  /** Where results are centred. Null → the user's selected home location. */
  center: SearchCenter | null;
  filters: ListingFilters;
  sort: ListingSort;
  view: SearchView;
  recent: SearchCenter[];
}

export const initialSearchState: SearchState = {
  center: null,
  filters: {},
  sort: ListingSort.Recommended,
  view: 'list',
  recent: [],
};

const MAX_RECENT = 8;

export const searchSlice = createSlice({
  name: 'search',
  initialState: initialSearchState,
  reducers: {
    searchHydrated(
      state,
      action: PayloadAction<Partial<Pick<SearchState, 'filters' | 'sort' | 'recent'>> | undefined>,
    ) {
      Object.assign(state, action.payload ?? {});
    },
    centerChosen(state, action: PayloadAction<SearchCenter>) {
      state.center = action.payload;
      state.recent = [
        action.payload,
        ...state.recent.filter(
          (r) => r.label !== action.payload.label || r.subtitle !== action.payload.subtitle,
        ),
      ].slice(0, MAX_RECENT);
    },
    centerCleared(state) {
      state.center = null;
    },
    filtersApplied(state, action: PayloadAction<ListingFilters>) {
      state.filters = action.payload;
    },
    sortChanged(state, action: PayloadAction<ListingSort>) {
      state.sort = action.payload;
    },
    viewChanged(state, action: PayloadAction<SearchView>) {
      state.view = action.payload;
    },
    recentCleared(state) {
      state.recent = [];
    },
  },
});

export const {
  searchHydrated,
  centerChosen,
  centerCleared,
  filtersApplied,
  sortChanged,
  viewChanged,
  recentCleared,
} = searchSlice.actions;

/** Number of active filters, for the badge on the Filters button. */
export function activeFilterCount(f: ListingFilters): number {
  return [
    f.types?.length,
    f.minRent !== undefined || f.maxRent !== undefined,
    f.sharing?.length,
    f.genders?.length,
    f.furnishing?.length,
    f.foodIncluded,
    f.amenities?.length,
    f.availableBy,
    f.q,
  ].filter(Boolean).length;
}
