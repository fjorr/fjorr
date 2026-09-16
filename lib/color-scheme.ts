export type ColorScheme = 'dark' | 'light';

export const COLOR_SCHEME_COOKIE = 'fjorr-color-scheme';

/** Soft off-white for light mode (matches existing light-01). */
export const LIGHT_PAGE_BG = '#F5F5F7';
export const LIGHT_PAGE_FG = '#0B0B0C';
export const DARK_PAGE_BG = '#1F1F1F';
export const DARK_PAGE_FG = '#F5F5F7';
/** The Mark (and other locked about children) stay true black. About root is black→white like the essay. */
export const ABOUT_PAGE_BG = '#000000';

/** Exact `/about` — hero is black; paper body is white. */
export function isAboutRootPath(pathname?: string | null): boolean {
  const path = pathname || '/';
  return path === '/about';
}

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
 * Essay under /about is paper (see isEssayFailurePath), not About black.
 */
export function isEssayFailurePath(pathname?: string | null): boolean {
  const path = pathname || '/';
  return (
    path === '/about/100-years-of-failure' ||
    path.startsWith('/about/100-years-of-failure/')
  );
}

export function isColorSchemeLockedPath(pathname?: string | null): boolean {
  const path = pathname || '/';
  if (isEssayFailurePath(path)) return false;
  if (isAboutRootPath(path)) return false;
  if (path === '/about' || path.startsWith('/about/')) return true;
  if (path.startsWith('/artifact/')) return true;
  if (path === '/admin' || path.startsWith('/admin/')) return true;
  return false;
}

export function isAboutPath(pathname?: string | null): boolean {
  const path = pathname || '/';
  if (isEssayFailurePath(path)) return false;
  return path === '/about' || path.startsWith('/about/');
}

/** Black end-to-end about children (e.g. The Mark) — not the root paper page. */
export function isAboutBlackPath(pathname?: string | null): boolean {
  return isAboutPath(pathname) && !isAboutRootPath(pathname);
}


/** House house + auth/join — always paper. Darkness is reserved for the theater. */
export const HOUSE_PAGE_BG = '#FFFFFF';

export function isHousePath(pathname?: string | null): boolean {
  const path = pathname || '/';
  if (path === '/') return true;
  if (path === '/film' || path.startsWith('/film/')) return true;
  if (path === '/signin' || path.startsWith('/signin/')) return true;
  if (path === '/account' || path.startsWith('/account/')) return true;
  if (path === '/bureaux' || path.startsWith('/bureaux/')) return true;
  if (path === '/partner' || path.startsWith('/partner/')) return true;
  if (path === '/subscribe' || path.startsWith('/subscribe/')) return true;
  if (path === '/search' || path.startsWith('/search/')) return true;
  if (isEssayFailurePath(path)) return true;
  if (isAboutRootPath(path)) return true;
  if (path === '/auth/error' || path.startsWith('/auth/')) return true;
  return false;
}

/**
 * Paths that show the 54px HouseFooter chrome (framed hero shell, or
 * in-flow scroll footer that pins while a sheet is open).
 * Overlay sheets leave room at the bottom only on these routes.
 */
export function hasHouseFooterChrome(pathname?: string | null): boolean {
  const path = pathname || '/';
  if (path === '/') return true;
  if (path === '/film' || path.startsWith('/film/')) return true;
  if (path === '/bureaux' || path.startsWith('/bureaux/')) return true;
  if (path === '/partner' || path.startsWith('/partner/')) return true;
  if (path === '/subscribe' || path.startsWith('/subscribe/')) return true;
  if (path === '/search' || path.startsWith('/search/')) return true;
  if (isEssayFailurePath(path)) return true;
  if (isAboutPath(path)) return true;
  if (path.startsWith('/artifact/')) return true;
  if (path === '/privacy' || path.startsWith('/privacy/')) return true;
  if (path === '/terms' || path.startsWith('/terms/')) return true;
  if (path === '/account' || path.startsWith('/account/')) return true;
  return false;
}
