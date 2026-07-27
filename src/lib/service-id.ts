/** Strict positive integer service id from a route param. */
export function parseServiceId(id: string): number | null {
  if (!/^\d+$/.test(id)) return null;
  const n = Number.parseInt(id, 10);
  if (!Number.isSafeInteger(n) || n < 1) return null;
  return n;
}
