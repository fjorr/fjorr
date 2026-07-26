export const locales = [
  'en',
  'es',
  'fr',
  'it',
  'de',
  'pt',
  'sv',
  'hi',
  'ko',
  'ja',
  'zh-tw',
] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'en';

export const LOCALE_COOKIE = 'fjorr-locale';

/** Native language names for the language menu. */
export const localeLabels: Record<AppLocale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  de: 'Deutsch',
  pt: 'Português',
  sv: 'Svenska',
  hi: 'हिन्दी',
  ko: '한국어',
  ja: '日本語',
  'zh-tw': '繁體中文',
};

export function parseLocale(value?: string | null): AppLocale {
  if (value && (locales as readonly string[]).includes(value)) {
    return value as AppLocale;
  }
  return defaultLocale;
}

/** Longest-first so `zh-tw` wins over a hypothetical `zh`. */
const localePrefixes = [...locales].sort((a, b) => b.length - a.length);

/**
 * Strip a leading locale prefix from a pathname (`/es/film/x` → `/film/x`).
 * Safe to call with already-unprefixed paths.
 */
export function stripLocalePrefix(pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  for (const code of localePrefixes) {
    if (path === `/${code}`) return '/';
    if (path.startsWith(`/${code}/`)) {
      const rest = path.slice(code.length + 1);
      return rest.startsWith('/') ? rest : `/${rest}`;
    }
  }
  return path || '/';
}
