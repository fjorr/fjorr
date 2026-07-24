/** Canonical production origin (matches live www host). */
export const SITE_ORIGIN = 'https://www.fjorr.com';

export function absoluteUrl(path = '/') {
  if (!path || path === '/') return SITE_ORIGIN;
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}
