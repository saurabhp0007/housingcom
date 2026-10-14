import { Platform } from 'react-native';
import type { AuthSessionResponse, AuthTokensResponse, UserResponse } from '@housingcom/contracts';
import { env } from '@/shared/config/env';
import { secureStorage } from '@/shared/storage/secure-storage';
import { sessionCleared, sessionStarted } from '@/shared/store/session.slice';
import type { AppDispatch } from '@/shared/store/types';
import { authApi } from '../auth.api';

const devicePlatform = Platform.OS === 'ios' ? 'ios' : 'android';

/** Session lifecycle: sign-in exchange, silent restore on launch, sign-out. */
export const sessionService = {
  /** Exchanges a phone number + OTP for an API session and stores it. */
  async signIn(dispatch: AppDispatch, phone: string, code: string): Promise<AuthSessionResponse> {
    const deviceId = await secureStorage.getOrCreateDeviceId();
    const session = await dispatch(
      authApi.endpoints.verifyOtp.initiate({
        phone,
        code,
        device: { id: deviceId, platform: devicePlatform },
      }),
    ).unwrap();
    await secureStorage.setRefreshToken(session.refreshToken);
    dispatch(sessionStarted({ accessToken: session.accessToken, user: session.user }));
    return session;
  },

  /** Restores the session from the stored refresh token. Never throws; falls back to guest. */
  async restore(dispatch: AppDispatch): Promise<void> {
    const refreshToken = await secureStorage.getRefreshToken();
    if (!refreshToken) {
      dispatch(sessionCleared());
      return;
    }
    try {
      const res = await fetch(`${env.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (res.status === 401 || res.status === 403) {
        await secureStorage.clearRefreshToken();
        dispatch(sessionCleared());
        return;
      }
      if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);
      const tokens = ((await res.json()) as { data: AuthTokensResponse }).data;
      await secureStorage.setRefreshToken(tokens.refreshToken);

      const meRes = await fetch(`${env.apiUrl}/users/me`, {
        headers: { authorization: `Bearer ${tokens.accessToken}` },
      });
      const user = ((await meRes.json()) as { data: UserResponse }).data;
      dispatch(sessionStarted({ accessToken: tokens.accessToken, user }));
    } catch {
      // Offline at launch: keep the refresh token and continue as guest; the next
      // authenticated request will refresh transparently.
      dispatch(sessionCleared());
    }
  },

  async signOut(dispatch: AppDispatch): Promise<void> {
    const refreshToken = await secureStorage.getRefreshToken();
    if (refreshToken) {
      await dispatch(authApi.endpoints.logout.initiate({ refreshToken }))
        .unwrap()
        .catch(() => undefined);
    }
    await secureStorage.clearRefreshToken();
    dispatch(sessionCleared());
    dispatch(authApi.util.resetApiState());
  },
};
