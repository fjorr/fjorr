/**
 * Tiny search-match excerpt for result cards.
 * Prefer search_content; skip name-only hits (title already shows).
 */

export type MatchSnippet = {
  text: string;
  /** Index of query within `text` (case-insensitive). */
  matchIndex: number;
  matchLength: number;
};

function windowAround(
  source: string,
  index: number,
  matchLen: number,
  radius = 36
): MatchSnippet {
  let start = Math.max(0, index - radius);
  let end = Math.min(source.length, index + matchLen + radius);
  if (start > 0) {
    const space = source.indexOf(' ', start);
    if (space > start && space < index) start = space + 1;
  }
  if (end < source.length) {
    const space = source.lastIndexOf(' ', end);
    if (space > index + matchLen) end = space;
  }
  const text =
    (start > 0 ? '…' : '') +
    source.slice(start, end).trim() +
    (end < source.length ? '…' : '');
  const local = text.toLowerCase().indexOf(source.slice(index, index + matchLen).toLowerCase());
  return {
    text,
    matchIndex: local >= 0 ? local : (start > 0 ? 1 : 0) + (index - start),
    matchLength: matchLen,
  };
}

/** First useful match excerpt from search_content, or null. */
export function searchMatchSnippet(
  item: {
    name?: string | null;
    teaser?: string | null;
    search_content?: string | null;
  },
  query: string
): MatchSnippet | null {
  const q = query.trim();
  if (q.length < 2) return null;
  const qLower = q.toLowerCase();

  const name = item.name?.trim() || '';
  const teaser = item.teaser?.trim() || '';
  const body = item.search_content?.trim() || '';
  if (!body) return null;

  const idx = body.toLowerCase().indexOf(qLower);
  if (idx < 0) return null;

  // Title already visible — skip name-only echoes.
  if (name && body.toLowerCase() === name.toLowerCase()) return null;
  // Teaser already shown on the card — skip identical body.
  if (teaser && body.toLowerCase() === teaser.toLowerCase()) return null;

  return windowAround(body, idx, q.length);
}
