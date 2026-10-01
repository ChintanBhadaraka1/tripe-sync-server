import { randomBytes } from 'crypto';

/**
 * Generates a URL-safe alphanumeric share code of the given length.
 * Default: 8 characters (e.g. "A3fK9mX2")
 */
export function generateShareCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(length * 2); // extra bytes for rejection sampling
  let result = '';
  for (let i = 0; i < bytes.length && result.length < length; i++) {
    const idx = bytes[i] % chars.length;
    result += chars[idx];
  }
  return result;
}
