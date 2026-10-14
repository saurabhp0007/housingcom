import { VISIT_SLOT_LABELS, type VisitResponse, type VisitStatus } from '@housingcom/contracts';
import type { PillTone } from '@housingcom/ui';

export const VISIT_STATUS_META: Record<VisitStatus, { label: string; tone: PillTone }> = {
  requested: { label: 'Awaiting owner', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  declined: { label: 'Declined', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

/** "Sat, 14 Mar · Evening (4–8)" */
export function visitWhen(v: Pick<VisitResponse, 'date' | 'slot'>): string {
  const day = new Date(`${v.date}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return `${day} · ${VISIT_SLOT_LABELS[v.slot]}`;
}
