import type { Platform, UpdateChannel } from '@housingcom/contracts';

/** An asset as stored for an update (URL is resolved per request). */
export interface OtaAssetRecord {
  /** base64url(SHA-256) — verified by the client after download. */
  hash: string;
  /** Stable cache key on device (MD5 hex, like Expo's reference server). */
  key: string;
  contentType: string;
  fileExtension: string;
  storageKey: string;
}

export interface OtaManifestRecord {
  launchAsset: OtaAssetRecord;
  assets: OtaAssetRecord[];
}

/** What the expo-updates client tells us about itself (from request headers). */
export interface OtaClientRequest {
  platform: Platform;
  runtimeVersion: string;
  channel: UpdateChannel;
  clientId: string;
  currentUpdateId: string | null;
  embeddedUpdateId: string | null;
  /** Updates that crashed on this device; never serve them again. */
  recentFailedUpdateIds: string[];
  expectSignature: boolean;
}

/** Minimal shape the selection policy needs. */
export interface OtaCandidate {
  id: string;
  rolloutPercent: number;
  createdAt: Date;
}

export type OtaDecision<T extends OtaCandidate = OtaCandidate> =
  { kind: 'update'; update: T } | { kind: 'noUpdateAvailable' } | { kind: 'rollBackToEmbedded' };
