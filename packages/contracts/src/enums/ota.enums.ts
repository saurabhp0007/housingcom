export const Platform = {
  Ios: 'ios',
  Android: 'android',
} as const;
export type Platform = (typeof Platform)[keyof typeof Platform];

export const UpdateChannel = {
  Development: 'development',
  Preview: 'preview',
  Production: 'production',
} as const;
export type UpdateChannel = (typeof UpdateChannel)[keyof typeof UpdateChannel];

export const UpdateStatus = {
  Active: 'active',
  Paused: 'paused',
  RolledBack: 'rolled_back',
} as const;
export type UpdateStatus = (typeof UpdateStatus)[keyof typeof UpdateStatus];

export const UpdateHealthEvent = {
  Launched: 'launched',
  Crashed: 'crashed',
} as const;
export type UpdateHealthEvent = (typeof UpdateHealthEvent)[keyof typeof UpdateHealthEvent];
