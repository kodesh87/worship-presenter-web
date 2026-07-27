/** Same-origin relative path only — blocks `//evil` open redirects. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || typeof next !== 'string') return '/';
  if (!next.startsWith('/')) return '/';
  if (next.startsWith('//')) return '/';
  if (next.includes('\\') || next.includes('\n') || next.includes('\r')) {
    return '/';
  }
  return next;
}
