import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEYLEN = 64;

/** Store format: `<saltHex>$<hashHex>` using Node crypto scrypt. */
export function hashPassword(password: string): string {
  if (!password) {
    throw new Error('Password must be non-empty');
  }
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN);
  return `${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!password || !stored) return false;
  const [saltHex, hashHex] = stored.split('$');
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    if (salt.length === 0 || expected.length === 0) return false;
    const actual = scryptSync(password, salt, expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
