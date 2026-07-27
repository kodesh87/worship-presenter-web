/** Result when webhook auth fails; `null` means allowed. */
export type WebhookAuthFailure = { status: 401 | 503; error: string };

/**
 * Validate webhook secret from env vs provided header value.
 * - Missing WEBHOOK_SECRET → 503
 * - Missing/wrong provided → 401
 */
export function assertWebhookSecretValue(
  envSecret: string | undefined,
  provided: string | null | undefined
): WebhookAuthFailure | null {
  if (!envSecret) {
    return {
      status: 503,
      error: 'Webhook not configured (WEBHOOK_SECRET missing)',
    };
  }
  if (!provided || provided !== envSecret) {
    return { status: 401, error: 'Unauthorized' };
  }
  return null;
}

/** Pull secret from x-webhook-secret or Authorization: Bearer. */
export function readWebhookSecretFromHeaders(headers: {
  get(name: string): string | null;
}): string | null {
  const direct = headers.get('x-webhook-secret');
  if (direct) return direct;
  const auth = headers.get('authorization');
  if (!auth) return null;
  return auth.replace(/^Bearer\s+/i, '') || null;
}
