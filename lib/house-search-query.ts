/** Shareable search query lives in `?q=` on `/search`. */

export const SEARCH_QUERY_PARAM = 'q';

export function readSearchQueryParam(
  search: string | URLSearchParams | null | undefined
): string {
  if (search == null) return '';
  const params =
    typeof search === 'string'
      ? new URLSearchParams(
          search.startsWith('?') ? search.slice(1) : search
        )
      : search;
  return (params.get(SEARCH_QUERY_PARAM) || '').trim();
}

/** Merge `q` into the current search string; omit when empty. */
export function pathWithSearchQuery(
  pathname: string,
  currentSearch: string | URLSearchParams,
  query: string | null | undefined
): string {
  const params = new URLSearchParams(
    typeof currentSearch === 'string'
      ? currentSearch.startsWith('?')
        ? currentSearch.slice(1)
        : currentSearch
      : currentSearch.toString()
  );
  const trimmed = (query || '').trim();
  if (trimmed) params.set(SEARCH_QUERY_PARAM, trimmed);
  else params.delete(SEARCH_QUERY_PARAM);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
