import Storage from 'expo-sqlite/kv-store';

const PREFIX = 'state.v1.';

/** SQLite-backed key-value persistence (expo-sqlite/kv-store) for non-sensitive slices (e.g. selected location, preferences). */
export const persistedState = {
  async load<T>(key: string): Promise<T | undefined> {
    try {
      const raw = await Storage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : undefined;
    } catch {
      return undefined;
    }
  },
  async save(key: string, value: unknown): Promise<void> {
    try {
      await Storage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Persistence is best-effort; the app works without it.
    }
  },
};
