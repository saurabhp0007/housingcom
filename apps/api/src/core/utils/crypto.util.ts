import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const sha256Hex = (input: string | Buffer): string =>
  createHash('sha256').update(input).digest('hex');

export const randomToken = (bytes = 48): string => randomBytes(bytes).toString('base64url');

/** Constant-time string comparison for secrets. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
