import { describe, expect, it } from 'vitest';
import { compareVersions, isVersionBelow } from './version.js';
import { formatDistance, haversineKm } from './geo.js';
import { formatRentCompact } from './money.js';
import { maskPhone, slugify } from './string.js';

describe('compareVersions', () => {
  it('compares numerically, not lexically', () => {
    expect(compareVersions('1.10.0', '1.9.9')).toBeGreaterThan(0);
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
    expect(isVersionBelow('1.0.9', '1.1.0')).toBe(true);
  });
});

describe('geo', () => {
  it('computes distance between two Bengaluru points', () => {
    const km = haversineKm({ lat: 12.9116, lng: 77.6474 }, { lat: 12.9352, lng: 77.6245 });
    expect(km).toBeGreaterThan(3);
    expect(km).toBeLessThan(4);
  });

  it('formats distances', () => {
    expect(formatDistance(0.45)).toBe('450 m');
    expect(formatDistance(2.44)).toBe('2.4 km');
    expect(formatDistance(14.6)).toBe('15 km');
  });
});

describe('formatting', () => {
  it('formats compact rent', () => {
    expect(formatRentCompact(8500)).toBe('₹8.5k');
    expect(formatRentCompact(9000)).toBe('₹9k');
    expect(formatRentCompact(120000)).toBe('₹1.2L');
  });

  it('slugifies and masks', () => {
    expect(slugify('HSR Layout, Sector 2')).toBe('hsr-layout-sector-2');
    expect(maskPhone('+919876543210')).toBe('+91******3210');
  });
});
