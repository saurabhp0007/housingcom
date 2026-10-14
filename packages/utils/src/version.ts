/**
 * Compares dotted numeric versions ("1.10.2" vs "1.9"). Missing parts count as 0.
 * Returns a negative number if a < b, 0 if equal, positive if a > b.
 */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((p) => Number.parseInt(p, 10) || 0);
  const pb = b.split('.').map((p) => Number.parseInt(p, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export const isVersionBelow = (version: string, minimum: string): boolean =>
  compareVersions(version, minimum) < 0;
