export const QueueName = {
  OtaHealth: 'ota-health',
  ListingEnrichment: 'listing-enrichment',
} as const;
export type QueueName = (typeof QueueName)[keyof typeof QueueName];
