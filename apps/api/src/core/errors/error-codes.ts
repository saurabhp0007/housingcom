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
  NotALister: 'USER_NOT_A_LISTER',
  CannotModerateSelf: 'USER_CANNOT_MODERATE_SELF',

  InvalidMedia: 'MEDIA_INVALID',
  MediaLimitReached: 'MEDIA_LIMIT_REACHED',

  ListingIncomplete: 'LISTING_INCOMPLETE',
  ListingTransitionNotAllowed: 'LISTING_TRANSITION_NOT_ALLOWED',
  LocationNotServiceable: 'LISTING_LOCATION_NOT_SERVICEABLE',

  VerificationAlreadyPending: 'VERIFICATION_ALREADY_PENDING',
  AlreadyVerified: 'VERIFICATION_ALREADY_VERIFIED',
  VerificationNotPending: 'VERIFICATION_NOT_PENDING',

  CannotEngageOwnListing: 'ENGAGEMENT_OWN_LISTING',
  ReviewNotAllowed: 'REVIEW_NOT_ALLOWED',
  ReportAlreadyOpen: 'REPORT_ALREADY_OPEN',
  ReportNotOpen: 'REPORT_NOT_OPEN',
  VisitNotPending: 'VISIT_NOT_PENDING',
  VisitDateInvalid: 'VISIT_DATE_INVALID',
  SavedSearchLimitReached: 'SAVED_SEARCH_LIMIT_REACHED',

  PaymentsUnavailable: 'PAYMENTS_UNAVAILABLE',
  PaymentGatewayError: 'PAYMENT_GATEWAY_ERROR',
  PaymentVerificationFailed: 'PAYMENT_VERIFICATION_FAILED',
  PlanNotAvailable: 'FEATURED_PLAN_NOT_AVAILABLE',
  FeaturedSlotsFull: 'FEATURED_SLOTS_FULL',
  FeatureNotAllowed: 'FEATURE_NOT_ALLOWED',
  FeatureTransitionNotAllowed: 'FEATURE_TRANSITION_NOT_ALLOWED',

  OtaInvalidBundle: 'OTA_INVALID_BUNDLE',
  OtaSigningUnavailable: 'OTA_SIGNING_UNAVAILABLE',
  OtaInvalidRequest: 'OTA_INVALID_REQUEST',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
