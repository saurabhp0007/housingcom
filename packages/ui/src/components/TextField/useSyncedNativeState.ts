import { useEffect } from 'react';

interface WritableState<T> {
  get(): T;
  set(value: T): void;
}

/**
 * Native text fields own their text in an observable native state (no re-render per keystroke).
 * This keeps that state in sync when the value changes from JS (form reset, prefill).
 * `useState` is the platform's `useNativeState` (Compose and SwiftUI states have different types).
 */
export function useSyncedNativeState<S extends WritableState<string>>(
  useState: (initial: string) => S,
  value: string,
): S {
  const state = useState(value);
  useEffect(() => {
    if (state.get() !== value) state.set(value);
  }, [state, value]);
  return state;
}
