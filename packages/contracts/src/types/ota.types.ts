import type {
  Platform,
  UpdateChannel,
  UpdateHealthEvent,
  UpdateStatus,
} from '../enums/ota.enums.js';

/** An OTA update as shown in the in-app Admin → App updates screen. */
export interface OtaUpdateResponse {
  id: string;
  platform: Platform;
  runtimeVersion: string;
  channel: UpdateChannel;
  status: UpdateStatus;
  rolloutPercent: number;
  isCritical: boolean;
  message: string | null;
  gitCommit: string | null;
  assetCount: number;
  launchCount: number;
  crashCount: number;
  crashRate: number;
  createdAt: string;
}

export interface OtaPublishResponse {
  updates: OtaUpdateResponse[];
}

export interface OtaHealthReport {
  updateId: string;
  event: UpdateHealthEvent;
}
