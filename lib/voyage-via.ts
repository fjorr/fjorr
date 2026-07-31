/**
 * Voyage lineage — share links use ?via={member_number}.
 * Cookie holds the hop until the first Voyage is stamped.
 */

export const VIA_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days
const VIA_COOKIE_PREFIX = 'fjorr_via_';

/** Cookie name keyed by film id (uuid-safe). */
export function viaCookieName(filmId: string): string {
  const id = String(filmId || '').trim();
  return `${VIA_COOKIE_PREFIX}${id}`;
}

/** Parse ?via= into a positive member number, or null. */
export function parseViaMemberNumber(
  raw: string | null | undefined
): number | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 1 || String(n) !== trimmed) return null;
  return n;
}

/**
 * Film share path. When memberNumber is set, attaches ?via= for lineage.
 * Optional atSeconds adds ?t= (combined cleanly with via).
 */
export function filmSharePath(opts: {
  slug: string;
  memberNumber?: number | null;
  atSeconds?: number | null;
}): string {
  const s = String(opts.slug || '').trim();
  if (!s) return '/';

  const params = new URLSearchParams();
  const via = Number(opts.memberNumber);
  if (Number.isFinite(via) && via >= 1) {
    params.set('via', String(via));
  }
  const t = Number(opts.atSeconds);
  if (Number.isFinite(t) && t >= 1) {
    params.set('t', String(Math.floor(t)));
  }

  const q = params.toString();
  return q ? `/film/${s}?${q}` : `/film/${s}`;
}

/** Path for a film share that attributes the passer. */
export function filmViaSharePath(slug: string, memberNumber: number): string {
  return filmSharePath({ slug, memberNumber });
}

/**
 * Who to stamp as referrer on first insert.
 * NULL = organic. Self-referral and missing candidate → organic.
 */
export function resolveReferrerUserId(opts: {
  candidateUserId: string | null | undefined;
  viewerUserId: string | null | undefined;
}): string | null {
  const candidate = opts.candidateUserId ? String(opts.candidateUserId) : '';
  if (!candidate) return null;
  const viewer = opts.viewerUserId ? String(opts.viewerUserId) : '';
  if (viewer && candidate === viewer) return null;
  return candidate;
}

/**
 * First-log stamp: keep existing referred_by forever (immutability).
 * Only apply a new referrer when there is no prior row.
 */
export function stampReferredByOnFirstLog(opts: {
  existingReferredBy: string | null | undefined;
  isFirstLog: boolean;
  candidateUserId: string | null | undefined;
  viewerUserId: string | null | undefined;
}): string | null {
  if (!opts.isFirstLog) {
    return opts.existingReferredBy ? String(opts.existingReferredBy) : null;
  }
  return resolveReferrerUserId({
    candidateUserId: opts.candidateUserId,
    viewerUserId: opts.viewerUserId,
  });
}

/** Read via cookie for a film (browser). */
export function readViaCookie(filmId: string): number | null {
  if (typeof document === 'undefined') return null;
  const name = viaCookieName(filmId);
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) {
      return parseViaMemberNumber(decodeURIComponent(rest.join('=')));
    }
  }
  return null;
}

/** Persist via for this film until first Voyage (browser). */
export function writeViaCookie(filmId: string, memberNumber: number) {
  if (typeof document === 'undefined') return;
  const id = String(filmId || '').trim();
  const n = parseViaMemberNumber(String(memberNumber));
  if (!id || n == null) return;
  const secure =
    typeof location !== 'undefined' && location.protocol === 'https:'
      ? '; Secure'
      : '';
  document.cookie = `${viaCookieName(id)}=${encodeURIComponent(String(n))}; Path=/; Max-Age=${VIA_COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

/** Drop via cookie after a successful Voyage stamp (browser). */
export function clearViaCookie(filmId: string) {
  if (typeof document === 'undefined') return;
  const id = String(filmId || '').trim();
  if (!id) return;
  document.cookie = `${viaCookieName(id)}=; Path=/; Max-Age=0; SameSite=Lax`;
}
