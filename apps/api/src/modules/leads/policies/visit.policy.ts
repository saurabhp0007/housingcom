import { VisitStatus } from '@housingcom/contracts';

/** How far ahead a visit can be booked. */
export const MAX_VISIT_DAYS_AHEAD = 60;
/** Open requests one customer can have on one listing. */
export const MAX_OPEN_VISITS_PER_LISTING = 1;

const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD in India time, which is what "today" means to users. */
export function todayIst(now: Date): string {
  return new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Visits can be requested from today up to MAX_VISIT_DAYS_AHEAD days out. */
export function isBookableDate(date: string, now: Date): boolean {
  const today = todayIst(now);
  if (date < today) return false;
  const days = (Date.parse(date) - Date.parse(today)) / DAY_MS;
  return days <= MAX_VISIT_DAYS_AHEAD;
}

/** Statuses a visit can move to, and who may move it. Pure so it is unit-tested. */
export function canTransitionVisit(
  from: VisitStatus,
  to: VisitStatus,
  actor: 'owner' | 'customer',
): boolean {
  if (actor === 'owner') {
    return (
      from === VisitStatus.Requested &&
      (to === VisitStatus.Confirmed || to === VisitStatus.Declined)
    );
  }
  return (
    to === VisitStatus.Cancelled &&
    (from === VisitStatus.Requested || from === VisitStatus.Confirmed)
  );
}

export const isOpenVisit = (s: VisitStatus) =>
  s === VisitStatus.Requested || s === VisitStatus.Confirmed;
