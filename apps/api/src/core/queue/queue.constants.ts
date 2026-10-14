export const QueueName = {
  OtaHealth: 'ota-health',
  ListingEnrichment: 'listing-enrichment',
  Push: 'push',
  SavedSearchAlerts: 'saved-search-alerts',
  FeaturedLifecycle: 'featured-lifecycle',
} as const;
export type QueueName = (typeof QueueName)[keyof typeof QueueName];
