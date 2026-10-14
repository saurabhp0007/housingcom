import type { Platform } from '../enums/ota.enums.js';

/** Remote config fetched on launch. Lets many fixes ship without any app update. */
export interface AppConfigResponse {
  platform: Platform;
  /** Native builds below this version must update from the store. */
  minSupportedVersion: string;
  /** Native builds below this version are nudged (dismissible). */
  latestVersion: string;
  storeUrl: string;
  featureFlags: Record<string, boolean>;
  supportPhone: string | null;
}
