import * as Updates from 'expo-updates';
import type { OtaHealthReport } from '@housingcom/contracts';
import { env } from '@/shared/config/env';

export type OtaCheckResult =
  { kind: 'none' } | { kind: 'ready'; critical: boolean } | { kind: 'rollback' };

/**
 * Thin layer over expo-updates for our self-hosted server.
 * - Health beacons let the server auto-pause a bad update (crash-rate gate).
 * - expo-updates itself also falls back to the previous bundle if a new one crashes on start,
 *   and reports those update IDs so the server never serves them to this device again.
 */
export const otaService = {
  get isEnabled(): boolean {
    return Updates.isEnabled && !__DEV__;
  },

  /** Info shown on the profile screen and attached to support requests. */
  info() {
    return {
      updateId: Updates.updateId,
      channel: Updates.channel,
      runtimeVersion: Updates.runtimeVersion,
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
      isEmergencyLaunch: Updates.isEmergencyLaunch,
      createdAt: Updates.createdAt,
    };
  },

  async checkAndFetch(): Promise<OtaCheckResult> {
    if (!this.isEnabled) return { kind: 'none' };
    const check = await Updates.checkForUpdateAsync();
    if (check.isRollBackToEmbedded) {
      await Updates.fetchUpdateAsync();
      return { kind: 'rollback' };
    }
    if (!check.isAvailable) return { kind: 'none' };

    const fetched = await Updates.fetchUpdateAsync();
    if (!fetched.isNew) return { kind: 'none' };
    const metadata = (fetched.manifest as { metadata?: { isCritical?: string } } | undefined)
      ?.metadata;
    return { kind: 'ready', critical: metadata?.isCritical === 'true' };
  },

  apply(): Promise<void> {
    return Updates.reloadAsync();
  },

  /** Fire-and-forget launch/crash beacon for the running OTA update (not the embedded bundle). */
  report(event: OtaHealthReport['event']): void {
    if (!this.isEnabled || Updates.isEmbeddedLaunch || !Updates.updateId) return;
    const body: OtaHealthReport = { updateId: Updates.updateId, event };
    void fetch(`${env.apiUrl}/ota/health`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => undefined);
  },

  /** Reports fatal JS errors against the running update, then defers to the default handler. */
  installCrashReporter(): void {
    const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
    if (!errorUtils) return;
    const previous = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error, isFatal) => {
      if (isFatal) this.report('crashed');
      previous(error, isFatal);
    });
  },
};

interface ErrorUtilsLike {
  getGlobalHandler(): (error: unknown, isFatal?: boolean) => void;
  setGlobalHandler(handler: (error: unknown, isFatal?: boolean) => void): void;
}
