import { defineRouting } from 'next-intl/routing';
import { defaultLocale, LOCALE_COOKIE, locales } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  localeCookie: {
    name: LOCALE_COOKIE,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  },
});
