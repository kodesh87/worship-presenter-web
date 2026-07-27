/**
 * Best-effort client address for the login throttle.
 *
 * The hub sits behind a Cloudflare Tunnel, so `cf-connecting-ip` is the header
 * the edge sets itself (cloudflared overwrites whatever the client sent);
 * `x-forwarded-for` / `x-real-ip` are honoured for plain reverse proxies and
 * local runs. On a *direct* connection to the origin all three are
 * client-supplied and therefore spoofable, so IP scoping is a coarse net, not
 * an identity.
 *
 * Two rules follow from that, and both exist to stop the limiter from becoming
 * the outage it is meant to prevent:
 *
 * 1. A header is only trusted as a rate-limit key if it actually parses as an
 *    IPv4 or IPv6 address. Anything else is discarded rather than used as a
 *    literal bucket name — otherwise a handful of requests carrying the same
 *    junk string fill a bucket every other client shares.
 * 2. When nothing parses, the caller gets `UNKNOWN_CLIENT_IP`, and
 *    `rate-limit.ts` refuses to throttle that bucket at all. It is shared by
 *    every client reaching the origin without a forwarding header — loopback,
 *    LAN, and the direct-to-box recovery path used when the tunnel is down —
 *    so locking it would lock the operator out of the machine on a Sabbath
 *    morning. The trade-off is stated in `rate-limit.ts`.
 */

/** Returned when no header parses; never used as a throttling key. */
export const UNKNOWN_CLIENT_IP = 'unknown';

/** Longest address we will look at: IPv6 + zone id fits comfortably. */
const MAX_IP_KEY_LENGTH = 64;
/** Bound the work done on a hostile `x-forwarded-for` chain. */
const MAX_FORWARDED_HEADER_LENGTH = 1024;

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isIpv4(value: string): boolean {
  const match = IPV4.exec(value);
  if (!match) return false;
  for (let i = 1; i <= 4; i++) {
    const octet = match[i] ?? '';
    // Reject `01.2.3.4`: two spellings of one address would be two buckets.
    if (octet.length > 1 && octet.startsWith('0')) return false;
    if (Number(octet) > 255) return false;
  }
  return true;
}

function isIpv6(value: string): boolean {
  if (!/^[0-9a-f:.]+$/.test(value)) return false;
  if (value.split('::').length - 1 > 1) return false;

  let text = value;
  let expectedGroups = 8;

  // Embedded IPv4 tail (`::ffff:203.0.113.7`) occupies the last two groups.
  const lastColon = text.lastIndexOf(':');
  if (lastColon === -1) return false;
  const tail = text.slice(lastColon + 1);
  if (tail.includes('.')) {
    if (!isIpv4(tail)) return false;
    text = text.slice(0, lastColon);
    expectedGroups = 6;
  } else if (text.includes('.')) {
    return false;
  }

  const hasDoubleColon = text.includes('::');
  const halves = text.split('::');
  if (halves.length > 2) return false;

  const groups: string[] = [];
  for (const half of halves) {
    if (!half) continue;
    groups.push(...half.split(':'));
  }
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return false;
  }

  return hasDoubleColon
    ? groups.length <= expectedGroups - 1
    : groups.length === expectedGroups;
}

/**
 * Returns a canonical address, or `null` when the value is not one. Accepts the
 * shapes proxies actually emit: bare, bracketed, with a port, with a zone id.
 */
export function parseClientIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let value = raw.trim();
  if (!value || value.length > MAX_IP_KEY_LENGTH) return null;

  // `[2001:db8::1]` / `[2001:db8::1]:443`
  const bracketed = /^\[([^\]]+)\](?::\d{1,5})?$/.exec(value);
  if (bracketed) value = bracketed[1] ?? '';

  // `203.0.113.7:443` — only IPv4 can carry a bare port unambiguously.
  const withPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d{1,5}$/.exec(value);
  if (withPort) value = withPort[1] ?? '';

  // A scope id (`fe80::1%eth0`) is link-local plumbing, not part of identity.
  const percent = value.indexOf('%');
  if (percent !== -1) value = value.slice(0, percent);

  value = value.toLowerCase();
  if (isIpv4(value) || isIpv6(value)) return value;
  return null;
}

export function getClientIp(headers: Headers): string {
  const cf = parseClientIp(headers.get('cf-connecting-ip'));
  if (cf) return cf;

  // `x-forwarded-for: <client>, <proxy1>, <proxy2>` — leftmost is the client.
  // Legacy proxies emit placeholders such as `unknown` in that slot, so take
  // the leftmost entry that is actually an address instead of trusting the
  // placeholder as a shared bucket name.
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    for (const hop of forwarded.slice(0, MAX_FORWARDED_HEADER_LENGTH).split(',')) {
      const parsed = parseClientIp(hop);
      if (parsed) return parsed;
    }
  }

  const real = parseClientIp(headers.get('x-real-ip'));
  if (real) return real;

  return UNKNOWN_CLIENT_IP;
}
