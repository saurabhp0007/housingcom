import type { AuthTokensResponse } from '@housingcom/contracts';
import { env } from '../config/env';
import { secureStorage } from '../storage/secure-storage';
import { sessionCleared, tokensRefreshed } from '../store/session.slice';
import type { AppDispatch } from '../store/types';

let inFlight: Promise<string | null> | null = null;

/**
 * Exchanges the stored refresh token for a new access token. Single-flight: concurrent
 * callers (RTK Query 401s, uploads) share one request. Returns the new access token, or
 * null after clearing the session when the refresh token is no longer valid.
 */
export function refreshAccessToken(dispatch: AppDispatch): Promise<string | null> {
  inFlight ??= (async () => {
    const refreshToken = await secureStorage.getRefreshToken();
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${env.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (res.status === 401 || res.status === 403) {
        await secureStorage.clearRefreshToken();
        dispatch(sessionCleared());
        return null;
      }
      if (!res.ok) return null;
      const tokens = ((await res.json()) as { data: AuthTokensResponse }).data;
      await secureStorage.setRefreshToken(tokens.refreshToken);
      dispatch(tokensRefreshed({ accessToken: tokens.accessToken }));
      return tokens.accessToken;
    } catch {
      return null; // offline: keep the session, retry later
    }
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
