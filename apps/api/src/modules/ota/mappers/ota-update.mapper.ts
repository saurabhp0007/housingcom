import type { OtaUpdateResponse } from '@housingcom/contracts';
import type { OtaUpdate } from '../entities/ota-update.entity.js';

export const toOtaUpdateResponse = (u: OtaUpdate): OtaUpdateResponse => ({
  id: u.id,
  platform: u.platform,
  runtimeVersion: u.runtimeVersion,
  channel: u.channel,
  status: u.status,
  rolloutPercent: u.rolloutPercent,
  isCritical: u.isCritical,
  message: u.message,
  gitCommit: u.gitCommit,
  assetCount: u.manifest.assets.length,
  launchCount: u.launchCount,
  crashCount: u.crashCount,
  crashRate: u.launchCount > 0 ? Math.round((u.crashCount / u.launchCount) * 1000) / 1000 : 0,
  createdAt: u.createdAt.toISOString(),
});
