export type OtaStatus = 'idle' | 'checking' | 'ready' | 'applying';

type Listener = () => void;

/**
 * External store for OTA status (read with useSyncExternalStore). Lives outside React so the
 * update check, the root overlay and the profile card share one source of truth.
 */
let status: OtaStatus = 'idle';
const listeners = new Set<Listener>();

export const otaStatusStore = {
  get: (): OtaStatus => status,
  set(next: OtaStatus): void {
    if (next === status) return;
    status = next;
    listeners.forEach((l) => l());
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
