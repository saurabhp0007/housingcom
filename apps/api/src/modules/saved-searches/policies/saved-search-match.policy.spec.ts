import { matchesFilters, type MatchableListing } from './saved-search-match.policy.js';

const listing: MatchableListing = {
  type: 'pg',
  rent: 9000,
  sharing: 'double',
  gender: 'girls',
  furnishing: 'furnished',
  foodIncluded: true,
  amenities: ['wifi', 'ac'],
  availableFrom: '2026-04-01',
  text: 'Sunny PG near Metro station, Koramangala',
};

describe('matchesFilters', () => {
  it('matches with no filters', () => {
    expect(matchesFilters(listing, {})).toBe(true);
  });

  it('checks type, budget and enums', () => {
    expect(matchesFilters(listing, { types: ['pg', 'room'], minRent: 5000, maxRent: 9000 })).toBe(
      true,
    );
    expect(matchesFilters(listing, { types: ['flat'] })).toBe(false);
    expect(matchesFilters(listing, { maxRent: 8999 })).toBe(false);
    expect(matchesFilters(listing, { genders: ['boys'] })).toBe(false);
    expect(matchesFilters(listing, { sharing: ['double'], furnishing: ['furnished'] })).toBe(true);
  });

  it('requires every amenity and food when asked', () => {
    expect(matchesFilters(listing, { amenities: ['wifi'] })).toBe(true);
    expect(matchesFilters(listing, { amenities: ['wifi', 'parking'] })).toBe(false);
    expect(matchesFilters({ ...listing, foodIncluded: false }, { foodIncluded: true })).toBe(false);
  });

  it('treats a missing available date as available now', () => {
    expect(matchesFilters(listing, { availableBy: '2026-03-31' })).toBe(false);
    expect(matchesFilters(listing, { availableBy: '2026-04-01' })).toBe(true);
    expect(matchesFilters({ ...listing, availableFrom: null }, { availableBy: '2026-01-01' })).toBe(
      true,
    );
  });

  it('matches all keywords case-insensitively', () => {
    expect(matchesFilters(listing, { q: 'metro koramangala' })).toBe(true);
    expect(matchesFilters(listing, { q: 'metro indiranagar' })).toBe(false);
  });
});
