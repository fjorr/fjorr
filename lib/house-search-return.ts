/** Leave ⌘K to watch a film, then reopen the same results on theater close. */

export const SEARCH_RETURN_KEY = 'fjorr-search-return';
export const SEARCH_REOPEN_KEY = 'fjorr-search-reopen';

export type SearchReturn = {
  path: string;
  query: string;
};

export function setSearchReturn(value: SearchReturn) {
  try {
    sessionStorage.setItem(SEARCH_RETURN_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('fjorr_search_return'));
  }
}

export function peekSearchReturn(): SearchReturn | null {
  try {
    const raw = sessionStorage.getItem(SEARCH_RETURN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SearchReturn;
    if (typeof parsed?.path !== 'string') return null;
    return {
      path: parsed.path,
      query: typeof parsed.query === 'string' ? parsed.query : '',
    };
  } catch {
    return null;
  }
}

export function takeSearchReturn(): SearchReturn | null {
  const value = peekSearchReturn();
  clearSearchReturn();
  return value;
}

export function clearSearchReturn() {
  try {
    sessionStorage.removeItem(SEARCH_RETURN_KEY);
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('fjorr_search_return'));
  }
}

export function queueSearchReopen(query: string) {
  try {
    sessionStorage.setItem(SEARCH_REOPEN_KEY, query);
  } catch {
    /* ignore */
  }
}

/** `null` = nothing queued; `''` = reopen empty catalog. */
export function takeSearchReopen(): string | null {
  try {
    if (sessionStorage.getItem(SEARCH_REOPEN_KEY) == null) return null;
    const query = sessionStorage.getItem(SEARCH_REOPEN_KEY) ?? '';
    sessionStorage.removeItem(SEARCH_REOPEN_KEY);
    return query;
  } catch {
    return null;
  }
}

/**
 * After theater / Info close — reopen ⌘K on the path where search was left.
 * Returns true when a return was consumed.
 */
export function resumeSearchReturn(
  pathname: string,
  navigate: (path: string) => void
): boolean {
  const ret = takeSearchReturn();
  if (!ret) return false;
  queueSearchReopen(ret.query);
  if (ret.path === pathname) {
    window.dispatchEvent(new Event('fjorr_search_reopen'));
    return true;
  }
  navigate(ret.path);
  return true;
}
