import { createHmac, timingSafeEqual } from 'node:crypto';

export const hmacSha256Hex = (secret: string, payload: string | Buffer) =>
  createHmac('sha256', secret).update(payload).digest('hex');

/** Constant-time comparison of two hex signatures. */
export function signaturesMatch(expectedHex: string, actual: string): boolean {
  const a = Buffer.from(expectedHex, 'utf8');
  const b = Buffer.from(actual, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
