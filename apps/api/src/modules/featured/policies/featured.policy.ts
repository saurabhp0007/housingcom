import { FeatureStatus } from '@housingcom/contracts';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Reminder lead time before a featured period ends (PRD: "reminder before a plan ends"). */
export const EXPIRY_REMINDER_MS = DAY_MS;

export interface PlanScope {
  cityId: string | null;
  areaId: string | null;
  isActive: boolean;
}

/**
 * Plans offered for a listing: the most specific scope that has active plans wins
 * (area → city → everywhere), so admins can price a hot area differently from its city.
 */
export function applicablePlans<T extends PlanScope>(
  plans: T[],
  listing: { cityId: string | null; areaId: string | null },
): T[] {
  const active = plans.filter((p) => p.isActive);
  const area = active.filter((p) => p.areaId && p.areaId === listing.areaId);
  if (area.length) return area;
  const city = active.filter((p) => !p.areaId && p.cityId && p.cityId === listing.cityId);
  if (city.length) return city;
  return active.filter((p) => !p.areaId && !p.cityId);
}

/** The tightest slot limit among the offered plans (null = unlimited). */
export function slotLimit(plans: { maxSlotsPerArea: number | null }[]): number | null {
  const limits = plans.map((p) => p.maxSlotsPerArea).filter((n): n is number => n !== null);
  return limits.length ? Math.min(...limits) : null;
}

/**
 * New period for a purchase: an open period is extended from its current end (renewing
 * early never loses days); otherwise a fresh period starts now.
 */
export function nextPeriod(
  open: { endsAt: Date } | null,
  durationDays: number,
  now: Date,
): { startsAt: Date | null; endsAt: Date } {
  const base = open && open.endsAt > now ? open.endsAt : now;
  return {
    startsAt: open ? null : now,
    endsAt: new Date(base.getTime() + durationDays * DAY_MS),
  };
}

/** Resuming gives back the time spent paused. */
export function resumedEnd(endsAt: Date, pausedAt: Date, now: Date): Date {
  return new Date(endsAt.getTime() + Math.max(0, now.getTime() - pausedAt.getTime()));
}

type Action = 'pause' | 'resume' | 'remove';

export function canTransitionFeature(from: FeatureStatus, action: Action): boolean {
  switch (action) {
    case 'pause':
      return from === FeatureStatus.Active;
    case 'resume':
      return from === FeatureStatus.Paused;
    case 'remove':
      return from === FeatureStatus.Active || from === FeatureStatus.Paused;
  }
}
