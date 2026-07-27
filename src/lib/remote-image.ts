import path from 'path';
import { isSafeImageUrl } from './images';

/**
 * The one hardened remote-image fetch.
 *
 * Two callers pull an image off someone else's host: deck generation
 * (`src/lib/pptx.ts`) embeds remote refs at render time, and
 * `POST /api/upload/from-url` downloads a link into a hub-local upload. Both go
 * through this module and nothing here is duplicated at either call site — a
 * second copy of an SSRF gate is how the two drift and one of them ends up
 * weaker.
 *
 * What the gate is made of, in order of how easily each is lost:
 *
 * - `redirect: 'error'`. A redirect is how a URL that passed `isSafeImageUrl`
 *   becomes one that would not have: `https://cdn.example.com/x.png` answering
 *   `302 -> http://169.254.169.254/` is checked once, at the allowed URL, and
 *   then followed to the blocked one. Refusing the hop is the whole defence.
 * - `isSafeImageUrl` re-run here, immediately before the call, so a caller
 *   cannot hand this function a ref it never checked.
 * - A cap enforced *while streaming*, so a lying `content-length` cannot
 *   exhaust RAM. The header pre-check is only an early exit, never the limit.
 * - A content-type allowlist, so an HTML error page or an SVG (scriptable) is
 *   refused rather than written to disk or embedded in a deck.
 * - An abort timeout, so one dead host cannot stall a Sunday download.
 */

/**
 * Shared byte budget for any image the hub embeds or stores from a remote host.
 *
 * Deliberately one number: an image too large to embed in a deck is of no use
 * downloaded either, and two limits would only invite them to disagree.
 */
export const MAX_IMAGE_BYTES = 16 * 1024 * 1024;

export const REMOTE_IMAGE_TIMEOUT_MS = 8000;

/**
 * Extension -> data-URI mime. The mime is echoed back by pptxgenjs as the media
 * extension (`/image\/(\w+);/`), so keeping `jpg` as `image/jpg` preserves the
 * archive's existing extensions and the `[Content_Types].xml` defaults that
 * already cover them.
 */
export const IMAGE_MIME_BY_EXT: Readonly<Record<string, string>> = {
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

const EXT_BY_IMAGE_MIME: Readonly<Record<string, string>> = {
  'image/jpg': '.jpg',
  'image/jpeg': '.jpeg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

/**
 * Why a fetch was refused. Each value is one distinct thing that went wrong, so
 * a caller can say which without inventing its own classification — and without
 * `blocked-url` ever explaining *why* the host is blocked to whoever asked.
 */
export type RemoteImageRefusal =
  | 'malformed-url'
  | 'blocked-url'
  | 'redirect'
  | 'timeout'
  | 'unreachable'
  | 'http-error'
  | 'not-an-image'
  | 'too-large'
  | 'empty';

export type RemoteImageResult =
  | { readonly ok: true; readonly bytes: Buffer; readonly extension: string }
  | {
      readonly ok: false;
      readonly reason: RemoteImageRefusal;
      /** Server-side log detail only. Never put this in a client response. */
      readonly detail?: string;
    };

function refuse(reason: RemoteImageRefusal, detail?: string): RemoteImageResult {
  return detail === undefined ? { ok: false, reason } : { ok: false, reason, detail };
}

/**
 * Extension implied by the response, or null when the type is not an image the
 * hub accepts.
 *
 * A declared-but-unsupported type (svg, an HTML error page, …) is refused
 * outright; only a *missing* content type falls back to the URL's extension.
 */
function remoteImageExtension(contentType: string | null, url: string): string | null {
  const mime = (contentType ?? '').split(';', 1)[0].trim().toLowerCase();
  const byMime = EXT_BY_IMAGE_MIME[mime];
  if (byMime) return byMime;
  if (mime) return null;
  try {
    const extension = path.posix.extname(new URL(url).pathname).toLowerCase();
    return IMAGE_MIME_BY_EXT[extension] ? extension : null;
  } catch {
    return null;
  }
}

/** Body bytes with a hard cap, so a lying `content-length` cannot exhaust RAM. */
async function readCappedBody(response: Response): Promise<Buffer | null> {
  const body = response.body;
  if (!body) return null;
  const reader = body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_IMAGE_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(Buffer.from(value));
    }
  } catch {
    try {
      await reader.cancel();
    } catch {
      // The stream is already dead; nothing to release.
    }
    return null;
  }
  return Buffer.concat(chunks);
}

/**
 * Classify a thrown `fetch` failure.
 *
 * Node reports every transport failure as `TypeError: fetch failed` and puts
 * the real reason in `cause`; a refused redirect arrives as `unexpected
 * redirect`. Sniffing that string only decides *which message* the operator
 * reads — the refusal itself is `redirect: 'error'` on the request and does not
 * depend on this at all. If the wording ever changes the call still fails,
 * still writes nothing, and merely reports "could not be reached".
 */
function classifyFetchError(error: unknown): RemoteImageResult {
  if (error instanceof Error && error.name === 'AbortError') {
    return refuse('timeout', error.message);
  }
  const cause = error instanceof Error ? error.cause : undefined;
  const causeMessage = cause instanceof Error ? cause.message : '';
  if (/redirect/i.test(causeMessage)) {
    return refuse('redirect', causeMessage);
  }
  const message = error instanceof Error ? error.message : String(error);
  return refuse('unreachable', causeMessage ? `${message}: ${causeMessage}` : message);
}

/**
 * Fetch a remote image as bytes, or say why it was refused.
 *
 * Nothing reaches the network until the URL has passed `isSafeImageUrl`, and
 * nothing is returned until the whole body has been read under the cap — so a
 * caller that writes the result to disk can be sure a refusal wrote nothing.
 */
export async function fetchRemoteImage(url: string): Promise<RemoteImageResult> {
  const ref = url.trim();

  // `isSafeImageUrl` also accepts hub-local `/api/uploads/*` refs, which are
  // read from disk and never fetched, so the scheme is checked separately here.
  if (!/^https?:\/\//i.test(ref)) return refuse('malformed-url');
  try {
    new URL(ref);
  } catch {
    return refuse('malformed-url');
  }
  if (!isSafeImageUrl(ref)) return refuse('blocked-url');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REMOTE_IMAGE_TIMEOUT_MS);
  try {
    let response: Response;
    try {
      response = await fetch(ref, {
        signal: controller.signal,
        redirect: 'error',
        cache: 'no-store',
      });
    } catch (error) {
      return classifyFetchError(error);
    }

    if (!response.ok) return refuse('http-error', `HTTP ${response.status}`);

    const declared = Number(response.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_IMAGE_BYTES) {
      return refuse('too-large', `content-length ${declared}`);
    }

    const contentType = response.headers.get('content-type');
    const extension = remoteImageExtension(contentType, ref);
    if (!extension) return refuse('not-an-image', `content-type ${contentType ?? 'absent'}`);

    const bytes = await readCappedBody(response);
    // `readCappedBody` returns null both for an overflowing body and for a
    // stream that died mid-read; either way nothing usable arrived, and the cap
    // is the reason worth naming.
    if (!bytes) return refuse('too-large', `body exceeded ${MAX_IMAGE_BYTES} bytes or stream failed`);
    if (bytes.length === 0) return refuse('empty');

    return { ok: true, bytes, extension };
  } finally {
    clearTimeout(timer);
    // Discard any body we bailed out of reading; a no-op once fully consumed.
    controller.abort();
  }
}
