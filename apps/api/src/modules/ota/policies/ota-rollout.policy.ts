import { createHash } from 'node:crypto';
import type { OtaCandidate, OtaClientRequest, OtaDecision } from '../domain/ota.types.js';

/**
 * Deterministic 0–99 bucket per (device, update). A device stays in or out of a staged
 * rollout consistently, and different updates sample different devices.
 */
export function rolloutBucket(clientId: string, updateId: string): number {
  const digest = createHash('sha256').update(`${clientId}:${updateId}`).digest();
  return digest.readUInt32BE(0) % 100;
}

export function isInRollout(clientId: string, updateId: string, rolloutPercent: number): boolean {
  if (rolloutPercent >= 100) return true;
  if (rolloutPercent <= 0) return false;
  return rolloutBucket(clientId, updateId) < rolloutPercent;
}

/**
 * Decides what a client should run.
 * - Newest active update the device is rolled out to, skipping ones that crashed on it.
 * - If the device runs an update that is no longer servable (paused / rolled back) and
 *   nothing replaces it, send it back to the bundle embedded in the binary.
 */
export function decideUpdate<T extends OtaCandidate>(
  activeNewestFirst: T[],
  client: Pick<
    OtaClientRequest,
    'clientId' | 'currentUpdateId' | 'embeddedUpdateId' | 'recentFailedUpdateIds'
  >,
): OtaDecision<T> {
  const failed = new Set(client.recentFailedUpdateIds);
  const target = activeNewestFirst.find(
    (u) => !failed.has(u.id) && isInRollout(client.clientId, u.id, u.rolloutPercent),
  );

  if (target) {
    return target.id === client.currentUpdateId
      ? { kind: 'noUpdateAvailable' }
      : { kind: 'update', update: target };
  }

  const runningDownloadedUpdate =
    !!client.currentUpdateId && client.currentUpdateId !== client.embeddedUpdateId;
  const currentStillServable = activeNewestFirst.some((u) => u.id === client.currentUpdateId);

  if (runningDownloadedUpdate && !currentStillServable) return { kind: 'rollBackToEmbedded' };
  return { kind: 'noUpdateAvailable' };
}

export interface AutoPauseThresholds {
  crashRate: number;
  minLaunches: number;
}

/** Health gate: pause an update once enough launches show a crash rate over threshold. */
export function shouldAutoPause(
  stats: { launchCount: number; crashCount: number },
  thresholds: AutoPauseThresholds,
): boolean {
  if (stats.launchCount < thresholds.minLaunches) return false;
  return stats.crashCount / stats.launchCount >= thresholds.crashRate;
}
