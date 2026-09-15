import type { Metadata } from 'next';
import { defaultLocale, locales, type AppLocale } from '@/i18n/config';
import { SITE_ORIGIN } from '@/lib/site';

/** Locale-prefixed path (EN unprefixed). */
export function localizedPath(locale: AppLocale, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (locale === defaultLocale) return normalized === '/' ? '/' : normalized;
  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`;
}

export function absoluteLocalizedUrl(locale: AppLocale, path: string): string {
  const p = localizedPath(locale, path);
  return p === '/' ? SITE_ORIGIN : `${SITE_ORIGIN}${p}`;
}

/**
 * HTML hreflang + locale-correct canonical for App Router metadata.
 * Pass the unprefixed path (e.g. `/`, `/film/slug`, `/about`).
 */
export function buildAlternates(
  path: string,
  locale: AppLocale
): NonNullable<Metadata['alternates']> {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = absoluteLocalizedUrl(loc, path);
  }
  languages['x-default'] = absoluteLocalizedUrl(defaultLocale, path);

  return {
    canonical: absoluteLocalizedUrl(locale, path),
    languages,
  };
}
