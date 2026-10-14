import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserResponse } from '@housingcom/contracts';

export type SessionStatus = 'restoring' | 'guest' | 'authenticated';

export interface SessionState {
  status: SessionStatus;
  /** Short-lived; kept in memory only. The refresh token lives in secure storage. */
  accessToken: string | null;
  user: UserResponse | null;
}

const initialState: SessionState = { status: 'restoring', accessToken: null, user: null };

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    sessionStarted(state, action: PayloadAction<{ accessToken: string; user: UserResponse }>) {
      state.status = 'authenticated';
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    tokensRefreshed(state, action: PayloadAction<{ accessToken: string }>) {
      state.status = 'authenticated';
      state.accessToken = action.payload.accessToken;
    },
    userUpdated(state, action: PayloadAction<UserResponse>) {
      state.user = action.payload;
    },
    sessionCleared(state) {
      state.status = 'guest';
      state.accessToken = null;
      state.user = null;
    },
  },
});

export const { sessionStarted, tokensRefreshed, userUpdated, sessionCleared } =
  sessionSlice.actions;
