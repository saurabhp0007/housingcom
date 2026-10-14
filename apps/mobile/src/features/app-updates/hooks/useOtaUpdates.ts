import { useToast } from '@housingcom/ui';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { otaService } from '../services/ota.service';
import { otaStatusStore } from '../services/ota-status.store';

const FOREGROUND_CHECK_INTERVAL_MS = 30 * 60_000;

/**
 * OTA lifecycle for the running app:
 * - on launch and when returning to foreground (at most every 30 min) check + download;
 * - critical updates reload immediately behind an "Updating" overlay;
 * - normal updates offer a "Restart" action and otherwise apply on next cold start.
 */
export function useOtaUpdates() {
  const toast = useToast();
  const lastCheck = useRef(0);
  const status = useSyncExternalStore(otaStatusStore.subscribe, otaStatusStore.get);

  useEffect(() => {
    const check = async () => {
      if (
        otaStatusStore.get() !== 'idle' ||
        Date.now() - lastCheck.current < FOREGROUND_CHECK_INTERVAL_MS
      )
        return;
      lastCheck.current = Date.now();
      otaStatusStore.set('checking');
      try {
        const result = await otaService.checkAndFetch();
        if (result.kind === 'ready' && result.critical) {
          otaStatusStore.set('applying');
          await otaService.apply();
          return;
        }
        if (result.kind === 'ready') {
          otaStatusStore.set('ready');
          toast.show({
            message: 'A new version is ready.',
            actionLabel: 'Restart',
            onAction: () => void otaService.apply(),
          });
          return;
        }
        // 'rollback' and 'none': nothing to show; a rollback applies on next launch.
        otaStatusStore.set('idle');
      } catch {
        // Network or server issues must never disturb the user; retry on next foreground.
        otaStatusStore.set('idle');
      }
    };

    otaService.installCrashReporter();
    otaService.report('launched');
    void check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => sub.remove();
  }, [toast]);

  return { applyingCritical: status === 'applying' };
}
