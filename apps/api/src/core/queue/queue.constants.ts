export const QueueName = {
  OtaHealth: 'ota-health',
  ListingEnrichment: 'listing-enrichment',
  Push: 'push',
  SavedSearchAlerts: 'saved-search-alerts',
} as const;
export type QueueName = (typeof QueueName)[keyof typeof QueueName];
