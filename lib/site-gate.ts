const GATE_PAYLOAD = 'fjorr-site-gate-v1';

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Signed cookie value for the optional site password gate. */
export async function createGateToken(secret: string): Promise<string> {
  return hmacHex(secret, GATE_PAYLOAD);
}

export async function isValidGateToken(
  token: string | undefined,
  secret: string | undefined
): Promise<boolean> {
  if (!token || !secret) return false;
  const expected = await createGateToken(secret);
  if (token.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Only allow same-origin relative paths. Blocks //evil.com, https://…, etc.
 */
export function safeInternalPath(
  next: string | null | undefined,
  fallback = '/'
): string {
  if (!next) return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return fallback;
  }
  try {
    const url = new URL(next, 'https://fjorr.invalid');
    if (url.origin !== 'https://fjorr.invalid') return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
