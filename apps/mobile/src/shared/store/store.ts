import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { addNetworkStateListener } from 'expo-network';
import { AppState } from 'react-native';
import { locationSlice } from '@/features/location/location.slice';
import { searchSlice } from '@/features/search/search.slice';
import { baseApi } from '../api/base-api';
import { listenerMiddleware } from './listener';
import { sessionSlice } from './session.slice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    [sessionSlice.name]: sessionSlice.reducer,
    [locationSlice.name]: locationSlice.reducer,
    [searchSlice.name]: searchSlice.reducer,
  },
  middleware: (getDefault) =>
    getDefault().prepend(listenerMiddleware.middleware).concat(baseApi.middleware),
});

// RTK Query's default listeners use browser events, which never fire in a native app.
// Wire app foreground/background and connectivity so refetchOnFocus / refetchOnReconnect work.
setupListeners(store.dispatch, (dispatch, { onFocus, onFocusLost, onOnline, onOffline }) => {
  const appState = AppState.addEventListener('change', (state) =>
    dispatch(state === 'active' ? onFocus() : onFocusLost()),
  );
  const network = addNetworkStateListener(({ isConnected, isInternetReachable }) =>
    dispatch(isConnected && isInternetReachable !== false ? onOnline() : onOffline()),
  );
  return () => {
    appState.remove();
    network.remove();
  };
});
