import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  refreshToken: 'auth.refreshToken',
  deviceId: 'device.id',
} as const;

/** Secrets live in the Keychain / Android Keystore, never in AsyncStorage or Redux persistence. */
export const secureStorage = {
  getRefreshToken: () => SecureStore.getItemAsync(KEYS.refreshToken),
  setRefreshToken: (token: string) => SecureStore.setItemAsync(KEYS.refreshToken, token),
  clearRefreshToken: () => SecureStore.deleteItemAsync(KEYS.refreshToken),

  async getOrCreateDeviceId(): Promise<string> {
    const existing = await SecureStore.getItemAsync(KEYS.deviceId);
    if (existing) return existing;
    const id = Crypto.randomUUID();
    await SecureStore.setItemAsync(KEYS.deviceId, id);
    return id;
  },
};
