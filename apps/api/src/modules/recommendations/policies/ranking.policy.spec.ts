import { ListingEventType as E } from '@housingcom/contracts';
import { buildAffinityProfile, DEFAULT_WEIGHTS, normaliseWeights } from './ranking.policy.js';

describe('normaliseWeights', () => {
  it('scales weights to sum to 1', () => {
    const w = normaliseWeights({ distance: 2, match: 1, personal: 1, popularity: 0, freshness: 0 });
    expect(w.distance).toBeCloseTo(0.5);
    expect(Object.values(w).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it('falls back to defaults when everything is zero', () => {
    expect(normaliseWeights({ distance: 0, match: 0, personal: 0, popularity: 0, freshness: 0 })).toEqual(DEFAULT_WEIGHTS);
  });

  it('ships defaults that already sum to 1', () => {
    expect(Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
});

describe('buildAffinityProfile', () => {
  it('is empty without history', () => {
    expect(buildAffinityProfile([])).toEqual({ types: {}, areas: {}, budget: null });
  });

  it('weights strong signals (contact) above views', () => {
    const p = buildAffinityProfile([
      { type: E.View, listingType: 'flat', areaId: 'a1', rent: 30000 },
      { type: E.View, listingType: 'flat', areaId: 'a1', rent: 30000 },
      { type: E.Contact, listingType: 'pg', areaId: 'a2', rent: 10000 },
    ]);
    expect(p.types.pg).toBe(1);
    expect(p.types.flat).toBe(0.5);
    expect(p.areas.a2).toBe(1);
    // (30000*1 + 30000*1 + 10000*4) / 6
    expect(p.budget).toBe(16667);
  });
});
