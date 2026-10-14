import { VisitStatus } from '@housingcom/contracts';
import { canTransitionVisit, isBookableDate, todayIst } from './visit.policy.js';

describe('visit policy', () => {
  const now = new Date('2026-03-10T20:00:00Z'); // 01:30 on 11 March in India

  it('uses the Indian calendar day', () => {
    expect(todayIst(now)).toBe('2026-03-11');
  });

  it('accepts today up to 60 days out', () => {
    expect(isBookableDate('2026-03-10', now)).toBe(false);
    expect(isBookableDate('2026-03-11', now)).toBe(true);
    expect(isBookableDate('2026-05-10', now)).toBe(true);
    expect(isBookableDate('2026-05-11', now)).toBe(false);
  });

  it('lets owners confirm or decline only pending requests', () => {
    expect(canTransitionVisit(VisitStatus.Requested, VisitStatus.Confirmed, 'owner')).toBe(true);
    expect(canTransitionVisit(VisitStatus.Requested, VisitStatus.Declined, 'owner')).toBe(true);
    expect(canTransitionVisit(VisitStatus.Confirmed, VisitStatus.Declined, 'owner')).toBe(false);
    expect(canTransitionVisit(VisitStatus.Requested, VisitStatus.Cancelled, 'owner')).toBe(false);
  });

  it('lets customers cancel open visits only', () => {
    expect(canTransitionVisit(VisitStatus.Requested, VisitStatus.Cancelled, 'customer')).toBe(true);
    expect(canTransitionVisit(VisitStatus.Confirmed, VisitStatus.Cancelled, 'customer')).toBe(true);
    expect(canTransitionVisit(VisitStatus.Declined, VisitStatus.Cancelled, 'customer')).toBe(false);
    expect(canTransitionVisit(VisitStatus.Requested, VisitStatus.Confirmed, 'customer')).toBe(
      false,
    );
  });
});
