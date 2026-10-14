import { createContext, useContext, useMemo, useRef, type PropsWithChildren } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../theme/tokens';
import { ToastHost } from './ToastHost';
import type { ToastHostHandle, ToastOptions } from './types';

interface ToastApi {
  show: (options: ToastOptions | string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const hostRef = useRef<ToastHostHandle>(null);
  const insets = useSafeAreaInsets();

  const api = useMemo<ToastApi>(
    () => ({
      show: (options) =>
        hostRef.current?.show(typeof options === 'string' ? { message: options } : options),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastHost ref={hostRef} bottomOffset={insets.bottom + spacing.xxxl * 2} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used inside <ToastProvider>');
  return api;
}
