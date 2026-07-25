export const locales = ['en', 'es', 'fr', 'it', 'de', 'pt', 'ja', 'zh-tw'] as const;
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
  ja: '日本語',
  'zh-tw': '繁體中文',
};

export function parseLocale(value?: string | null): AppLocale {
  if (value && (locales as readonly string[]).includes(value)) {
    return value as AppLocale;
  }
  return defaultLocale;
}
