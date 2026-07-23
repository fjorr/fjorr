export const locales = ['en', 'fr', 'es', 'it'] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'en';

export const LOCALE_COOKIE = 'fjorr-locale';

export function parseLocale(value?: string | null): AppLocale {
  if (value && (locales as readonly string[]).includes(value)) {
    return value as AppLocale;
  }
  return defaultLocale;
}
