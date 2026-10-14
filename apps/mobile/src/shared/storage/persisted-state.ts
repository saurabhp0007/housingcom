import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'state.v1.';

/** Tiny persistence for non-sensitive slices (e.g. selected location, preferences). */
export const persistedState = {
  async load<T>(key: string): Promise<T | undefined> {
    try {
      const raw = await AsyncStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : undefined;
    } catch {
      return undefined;
    }
  },
  async save(key: string, value: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Persistence is best-effort; the app works without it.
    }
  },
};
