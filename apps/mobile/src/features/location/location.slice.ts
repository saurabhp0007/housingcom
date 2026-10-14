import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Coordinates } from '@housingcom/contracts';

export interface SelectedLocation {
  label: string;
  coords: Coordinates;
  cityId: string | null;
  areaId: string | null;
  source: 'gps' | 'manual';
}

export type LocationPermission = 'unknown' | 'granted' | 'denied';

export interface LocationState {
  selected: SelectedLocation | null;
  permission: LocationPermission;
  hydrated: boolean;
}

const initialState: LocationState = { selected: null, permission: 'unknown', hydrated: false };

export const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    locationHydrated(state, action: PayloadAction<SelectedLocation | undefined>) {
      state.selected = action.payload ?? state.selected;
      state.hydrated = true;
    },
    locationSelected(state, action: PayloadAction<SelectedLocation>) {
      state.selected = action.payload;
    },
    permissionChanged(state, action: PayloadAction<LocationPermission>) {
      state.permission = action.payload;
    },
  },
});

export const { locationHydrated, locationSelected, permissionChanged } = locationSlice.actions;
