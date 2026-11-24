import { timingSafeEqual } from "crypto";

/**
 * Constant-time comparison of a provided secret against the expected one,
 * so response timing can't be used to guess the password byte-by-byte.
 */
export function isValidAdminPassword(
  provided: string,
  expected: string,
): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  // timingSafeEqual throws if buffers differ in length, so check that first.
  if (providedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(providedBuf, expectedBuf);
}
