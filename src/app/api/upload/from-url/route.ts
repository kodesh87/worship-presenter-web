import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ensureUploadsDir, isLocalUploadRef, UPLOAD_IMAGE_EXT } from '@/lib/uploads';
import {
  fetchRemoteImage,
  MAX_IMAGE_BYTES,
  type RemoteImageRefusal,
} from '@/lib/remote-image';

/**
 * Download an image link into a hub-local upload.
 *
 * The sibling of `POST /api/upload`, and deliberately identical from the
 * client's side: same `{ url }` response, same `/api/uploads/<32-hex>.<ext>`
 * shape, same uploads directory. The difference is only where the bytes come
 * from — and that difference is the whole reason `@/lib/remote-image` exists
 * rather than a second fetch written here.
 *
 * Storing a copy is the point, not an implementation detail. The offline PPTX
 * is the load-bearing Sabbath path, and a deck that still points at someone
 * else's host is one outage away from a blank slide in front of the
 * congregation.
 *
 * Authentication is the proxy gate in `src/proxy.ts`, which exempts only the
 * webhook, the login routes and build output — this path is covered like every
 * other API route and must never be added to that matcher.
 */

const MAX_IMAGE_MB = Math.round(MAX_IMAGE_BYTES / (1024 * 1024));

/**
 * One message per refusal, so the operator learns which thing went wrong.
 *
 * `blocked-url` is the one that stays vague on purpose: saying *why* an address
 * is refused turns this route into a probe for what is reachable from the
 * server. Everything else is about the operator's own link and is safe to name.
 */
const REFUSAL_RESPONSE: Readonly<
  Record<RemoteImageRefusal, { status: number; message: string }>
> = {
  'malformed-url': {
    status: 400,
    message: "That isn't a valid link. Use a full http:// or https:// address.",
  },
  'blocked-url': {
    status: 400,
    message: 'That address is not allowed.',
  },
  redirect: {
    status: 400,
    message:
      'That link redirects somewhere else. Use the image’s direct address instead.',
  },
  timeout: {
    status: 504,
    message: 'That host took too long to answer.',
  },
  unreachable: {
    status: 502,
    message: 'That host could not be reached.',
  },
  'http-error': {
    status: 502,
    message: 'That host refused to serve the image.',
  },
  'not-an-image': {
    status: 400,
    message:
      'That link is not an image (use a .jpg, .jpeg, .png, .gif or .webp address).',
  },
  'too-large': {
    status: 413,
    message: `That image is larger than the ${MAX_IMAGE_MB} MB limit.`,
  },
  empty: {
    status: 502,
    message: 'That link returned an empty response.',
  },
};

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body' }, { status: 400 });
  }

  const raw = (body as { url?: unknown } | null)?.url;
  if (typeof raw !== 'string' || !raw.trim()) {
    return NextResponse.json({ error: 'No image link provided' }, { status: 400 });
  }
  const link = raw.trim();

  const result = await fetchRemoteImage(link);
  if (!result.ok) {
    // The link itself is the operator's, so it is safe to echo back to the
    // server log; the reason detail is not, and stops here.
    console.error(
      `Image fetch refused (${result.reason}) for ${link}:`,
      result.detail ?? '(no detail)'
    );
    const { status, message } = REFUSAL_RESPONSE[result.reason];
    return NextResponse.json({ error: message }, { status });
  }

  // The shared fetcher only ever returns an allowed extension; checking anyway
  // means a future change there can never write a filename that
  // `isLocalUploadRef` — and therefore `isSafeImageUrl` — would reject.
  if (!UPLOAD_IMAGE_EXT.test(result.extension)) {
    console.error('Image fetch produced an unusable extension:', result.extension);
    return NextResponse.json({ error: 'Failed to save the image' }, { status: 500 });
  }

  try {
    const uploadsDir = ensureUploadsDir();
    const filename = `${crypto.randomBytes(16).toString('hex')}${result.extension}`;
    const url = `/api/uploads/${filename}`;
    if (!isLocalUploadRef(url)) {
      console.error('Image fetch produced an unusable upload ref:', url);
      return NextResponse.json({ error: 'Failed to save the image' }, { status: 500 });
    }
    fs.writeFileSync(path.join(uploadsDir, filename), result.bytes);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Image fetch write error:', error);
    return NextResponse.json({ error: 'Failed to save the image' }, { status: 500 });
  }
}
