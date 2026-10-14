import { createListenerMiddleware } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from './types';

/** Side effects reacting to actions (persistence, analytics) live in feature listeners. */
export const listenerMiddleware = createListenerMiddleware();

export const startAppListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();
