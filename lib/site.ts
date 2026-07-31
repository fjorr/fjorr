/** Canonical production origin (matches live www host). */
export const SITE_ORIGIN = 'https://www.fjorr.com';

export function absoluteUrl(path = '/') {
  if (!path || path === '/') return SITE_ORIGIN;
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Origin for app redirects (Checkout / Portal return URLs).
 * Prefers NEXT_PUBLIC_SITE_URL, then Vercel, then localhost in dev.
 */
export function appOrigin() {
  const explicit = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3000';
  return SITE_ORIGIN;
}

export function appUrl(path = '/') {
  const origin = appOrigin();
  if (!path || path === '/') return origin;
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}
