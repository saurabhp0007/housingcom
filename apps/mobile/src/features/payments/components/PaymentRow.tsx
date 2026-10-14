import type { PaymentResponse } from '@housingcom/contracts';
import { AppText, Card, HStack, Pill, VStack } from '@housingcom/ui';
import { formatInr } from '@housingcom/utils';

const STATUS = {
  paid: { label: 'Paid', tone: 'success' },
  created: { label: 'Not completed', tone: 'neutral' },
  failed: { label: 'Failed', tone: 'danger' },
} as const;

/** One payment in the lister's history or the admin list. */
export function PaymentRow({ payment: p }: { payment: PaymentResponse }) {
  const status = STATUS[p.status];
  return (
    <Card>
      <VStack gap="xxs">
        <HStack justify="space-between" align="center" gap="sm">
          <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {p.description}
          </AppText>
          <AppText variant="heading">{formatInr(p.amountInr)}</AppText>
        </HStack>
        <HStack justify="space-between" align="center">
          <AppText variant="caption" color="textSecondary">
            {new Date(p.paidAt ?? p.createdAt).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
            {p.user ? ` · ${p.user.name ?? p.user.phone ?? 'User'}` : ''}
          </AppText>
          <Pill label={status.label} tone={status.tone} />
        </HStack>
        {p.gatewayPaymentId ? (
          <AppText variant="caption" color="textSecondary" selectable>
            Ref: {p.gatewayPaymentId}
          </AppText>
        ) : null}
        {p.failureReason ? (
          <AppText variant="caption" color="danger">
            {p.failureReason}
          </AppText>
        ) : null}
      </VStack>
    </Card>
  );
}
