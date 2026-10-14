export const QueueName = {
  OtaHealth: 'ota-health',
} as const;
export type QueueName = (typeof QueueName)[keyof typeof QueueName];
