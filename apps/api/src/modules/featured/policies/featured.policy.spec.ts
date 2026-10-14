import { FeatureStatus } from '@housingcom/contracts';
import {
  applicablePlans,
  canTransitionFeature,
  nextPeriod,
  resumedEnd,
  slotLimit,
} from './featured.policy.js';

const plan = (
  o: Partial<{
    cityId: string | null;
    areaId: string | null;
    isActive: boolean;
    maxSlotsPerArea: number | null;
    name: string;
  }>,
) => ({
  cityId: null,
  areaId: null,
  isActive: true,
  maxSlotsPerArea: null,
  name: 'x',
  ...o,
});

describe('featured policy', () => {
  const listing = { cityId: 'blr', areaId: 'hsr' };

  it('offers the most specific scope that has active plans', () => {
    const global = plan({ name: 'global' });
    const city = plan({ name: 'city', cityId: 'blr' });
    const area = plan({ name: 'area', cityId: 'blr', areaId: 'hsr' });
    const otherArea = plan({ name: 'other', cityId: 'blr', areaId: 'kor' });
    expect(applicablePlans([global, city, area, otherArea], listing).map((p) => p.name)).toEqual([
      'area',
    ]);
    expect(applicablePlans([global, city, otherArea], listing).map((p) => p.name)).toEqual([
      'city',
    ]);
    expect(applicablePlans([global, otherArea], listing).map((p) => p.name)).toEqual(['global']);
    expect(
      applicablePlans([plan({ areaId: 'hsr', isActive: false }), global], listing).map(
        (p) => p.name,
      ),
    ).toEqual(['global']);
  });

  it('uses the tightest slot limit', () => {
    expect(slotLimit([plan({}), plan({ maxSlotsPerArea: 5 }), plan({ maxSlotsPerArea: 3 })])).toBe(
      3,
    );
    expect(slotLimit([plan({})])).toBeNull();
  });

  it('extends an open period from its end, else starts now', () => {
    const now = new Date('2026-03-01T00:00:00Z');
    expect(nextPeriod(null, 7, now)).toEqual({
      startsAt: now,
      endsAt: new Date('2026-03-08T00:00:00Z'),
    });
    expect(nextPeriod({ endsAt: new Date('2026-03-05T00:00:00Z') }, 7, now).endsAt).toEqual(
      new Date('2026-03-12T00:00:00Z'),
    );
    // An open period that already lapsed (job not yet run) restarts from now.
    expect(nextPeriod({ endsAt: new Date('2026-02-20T00:00:00Z') }, 7, now).endsAt).toEqual(
      new Date('2026-03-08T00:00:00Z'),
    );
  });

  it('gives paused time back on resume', () => {
    expect(
      resumedEnd(
        new Date('2026-03-10T00:00:00Z'),
        new Date('2026-03-01T00:00:00Z'),
        new Date('2026-03-03T00:00:00Z'),
      ),
    ).toEqual(new Date('2026-03-12T00:00:00Z'));
  });

  it('allows only sensible admin actions', () => {
    expect(canTransitionFeature(FeatureStatus.Active, 'pause')).toBe(true);
    expect(canTransitionFeature(FeatureStatus.Paused, 'pause')).toBe(false);
    expect(canTransitionFeature(FeatureStatus.Paused, 'resume')).toBe(true);
    expect(canTransitionFeature(FeatureStatus.Expired, 'remove')).toBe(false);
  });
});
