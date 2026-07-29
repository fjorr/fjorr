export type ColorScheme = 'dark' | 'light';

export const COLOR_SCHEME_COOKIE = 'fjorr-color-scheme';

/** Soft off-white for light mode (matches existing light-01). */
export const LIGHT_PAGE_BG = '#F5F5F7';
export const LIGHT_PAGE_FG = '#0B0B0C';
export const DARK_PAGE_BG = '#1F1F1F';
export const DARK_PAGE_FG = '#F5F5F7';

export function parseColorScheme(value?: string | null): ColorScheme {
  return value === 'light' ? 'light' : 'dark';
}

export function readColorSchemeCookie(): ColorScheme {
  if (typeof document === 'undefined') return 'dark';
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COLOR_SCHEME_COOKIE}=`));
  return parseColorScheme(match?.split('=')[1]);
}

export function writeColorSchemeCookie(scheme: ColorScheme) {
  if (typeof document === 'undefined') return;
  document.cookie = `${COLOR_SCHEME_COOKIE}=${scheme}; path=/; max-age=31536000; SameSite=Lax`;
}

/**
 * These routes keep their own dark / custom surfaces — never flip them to light.
 * Pathname is locale-stripped (next-intl usePathname).
 */
export function isColorSchemeLockedPath(pathname?: string | null): boolean {
  const path = pathname || '/';
  if (path === '/about' || path.startsWith('/about/')) return true;
  if (path === '/partner' || path.startsWith('/partner/')) return true;
  if (path.startsWith('/artifact/')) return true;
  if (path === '/admin' || path.startsWith('/admin/')) return true;
  return false;
}
