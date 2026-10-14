import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { locationSlice } from '@/features/location/location.slice';
import { baseApi } from '../api/base-api';
import { listenerMiddleware } from './listener';
import { sessionSlice } from './session.slice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    [sessionSlice.name]: sessionSlice.reducer,
    [locationSlice.name]: locationSlice.reducer,
  },
  middleware: (getDefault) =>
    getDefault().prepend(listenerMiddleware.middleware).concat(baseApi.middleware),
});

// Refetch on reconnect / app focus.
setupListeners(store.dispatch);
