/** Stable, client-facing error codes. The app maps these to copy; never parse messages. */
export const ErrorCode = {
  ValidationFailed: 'VALIDATION_FAILED',
  Unauthorized: 'UNAUTHORIZED',
  Forbidden: 'FORBIDDEN',
  NotFound: 'NOT_FOUND',
  Conflict: 'CONFLICT',
  RateLimited: 'RATE_LIMITED',
  Internal: 'INTERNAL_ERROR',

  InvalidIdentityToken: 'AUTH_INVALID_IDENTITY_TOKEN',
  InvalidRefreshToken: 'AUTH_INVALID_REFRESH_TOKEN',
  UserBlocked: 'AUTH_USER_BLOCKED',

  AlreadyLister: 'USER_ALREADY_LISTER',

  OtaInvalidBundle: 'OTA_INVALID_BUNDLE',
  OtaSigningUnavailable: 'OTA_SIGNING_UNAVAILABLE',
  OtaInvalidRequest: 'OTA_INVALID_REQUEST',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
