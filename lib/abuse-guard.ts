/**
 * In-process guards for public writes.
 * Each server instance keeps its own window, which is enough to stop a
 * tight loop and still lets a person retry. A shared store is the next step
 * if a single address starts spreading across instances.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();
const seen = new Map<string, number>();

const DISPOSABLE = new Set([
  'mailinator.com',
  'mailinator.net',
  'mailinator.org',
  'guerrillamail.com',
  'guerrillamail.info',
  'guerrillamail.biz',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'spam4.me',
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '10mail.org',
  '10mail.xyz',
  'minuteinbox.com',
  'tempmail.com',
  'tempmail.net',
  'tempmail.org',
  'temp-mail.org',
  'temp-mail.io',
  'tempmailo.com',
  'tempmail.plus',
  'tempmail.email',
  'tempr.email',
  'tempinbox.com',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'yopmail.org',
  'cool.fr.nf',
  'jetable.fr.nf',
  'trashmail.com',
  'trashmail.de',
  'trashmail.org',
  'trashmail.me',
  'trashmail.fr',
  'trash-mail.com',
  'trashmailer.com',
  'dispostable.com',
  'mailnesia.com',
  'maildrop.cc',
  'getnada.com',
  'nada.email',
  'inboxkitten.com',
  'emailondeck.com',
  'moakt.com',
  'moakt.cc',
  'moakt.ws',
  'tempail.com',
  'tmpmail.org',
  'tmpmail.net',
  'mohmal.com',
  'mytemp.email',
  'mintemail.com',
  'mailcatch.com',
  'fakeinbox.com',
  'mailnull.com',
  'spamgourmet.com',
  'discard.email',
  'discardmail.com',
  'mailforspam.com',
  'mailsac.com',
  'dropmail.me',
  'mailpoof.com',
  'burnermail.io',
  'emailfake.com',
  'generator.email',
  'fakemailgenerator.com',
  'gustr.com',
  '1secmail.com',
  '1secmail.org',
  '1secmail.net',
  'binkmail.com',
  'bobmail.info',
  'devnullmail.com',
  'letthemeatspam.com',
  'safetymail.info',
  'spamhereplease.com',
  'thisisnotmyrealemail.com',
  'veryrealemail.com',
  'example.com',
  'example.org',
  'example.net',
  'test.com',
]);

export function resetAbuseGuards() {
  buckets.clear();
  seen.clear();
}

export function clientIp(header: (name: string) => string | null): string {
  const real = header('x-real-ip')?.split(',')[0]?.trim();
  if (real) return real.slice(0, 80);
  const forwarded = header('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.slice(0, 80);
  }
  return 'unknown';
}

/** True when this key is still inside its allowance. */
export function allowRate(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 4000) {
    for (const [name, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(name);
    }
  }
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

function pruneSeen(now: number) {
  if (seen.size <= 4000) return;
  for (const [name, expiry] of seen) {
    if (expiry <= now) seen.delete(name);
  }
}

/** True when this key was marked and the window is still open. */
export function seenInWindow(key: string): boolean {
  const expiry = seen.get(key);
  return Boolean(expiry && expiry > Date.now());
}

export function markSeen(key: string, windowMs: number) {
  const now = Date.now();
  pruneSeen(now);
  seen.set(key, now + windowMs);
}

/**
 * True the first time this key is seen inside the window.
 * Later calls stay false until the window expires.
 */
export function firstInWindow(key: string, windowMs: number): boolean {
  if (seenInWindow(key)) return false;
  markSeen(key, windowMs);
  return true;
}

export function isAllowedSiteOrigin(origin: string | null): boolean {
  if (!origin) return true;
  let host = '';
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return true;
  if (host === 'fjorr.com' || host.endsWith('.fjorr.com')) return true;
  if (host.endsWith('.vercel.app') && host.includes('fjorr')) return true;
  return false;
}

function domainBlocked(domain: string): boolean {
  let current = domain;
  while (current.includes('.')) {
    if (DISPOSABLE.has(current)) return true;
    current = current.slice(current.indexOf('.') + 1);
  }
  return false;
}

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1] || '';
  if (!domain || !domain.includes('.')) return true;
  return domainBlocked(domain);
}

/**
 * Collapse provider aliases so one inbox cannot fill the list many times.
 * The checkout still stores the address the person typed.
 */
export function newsletterIdentity(email: string): string {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf('@');
  if (at < 1) return normalized;
  let local = normalized.slice(0, at);
  let domain = normalized.slice(at + 1);
  if (domain === 'googlemail.com') domain = 'gmail.com';
  if (domain === 'gmail.com') {
    local = local.split('+')[0].replace(/\./g, '');
  } else if (
    domain === 'outlook.com' ||
    domain === 'hotmail.com' ||
    domain === 'live.com' ||
    domain === 'icloud.com' ||
    domain === 'me.com' ||
    domain === 'mac.com'
  ) {
    local = local.split('+')[0];
  }
  if (!local) return normalized;
  return `${local}@${domain}`;
}
