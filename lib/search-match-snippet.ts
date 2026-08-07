/**
 * Tiny search-match excerpt for result cards.
 * Prefer a short, match-leading window so line-clamp-1 still shows the hit.
 */

export type MatchSnippet = {
  text: string;
  /** Index of query within `text` (case-insensitive). */
  matchIndex: number;
  matchLength: number;
};

/**
 * Build a one-line excerpt with the match near the start (not buried),
 * so `line-clamp-1` doesn’t cut the highlighted word off.
 */
function windowAround(
  source: string,
  index: number,
  matchLen: number
): MatchSnippet {
  // Short lead-in — enough for a word boundary, not a long clause.
  const lead = 10;
  const trail = 42;
  let start = Math.max(0, index - lead);
  let end = Math.min(source.length, index + matchLen + trail);

  if (start > 0) {
    const space = source.lastIndexOf(' ', index - 1);
    if (space >= start && space < index) start = space + 1;
    // If still mid-word / no space, hard-start near the match.
    if (index - start > lead + 4) start = Math.max(0, index - 4);
  }
  if (end < source.length) {
    const space = source.indexOf(' ', index + matchLen);
    if (space > index + matchLen && space <= end) end = space;
  }

  const text =
    (start > 0 ? '…' : '') +
    source.slice(start, end).trim() +
    (end < source.length ? '…' : '');

  const needle = source.slice(index, index + matchLen).toLowerCase();
  const local = text.toLowerCase().indexOf(needle);
  return {
    text,
    matchIndex: local >= 0 ? local : (start > 0 ? 1 : 0),
    matchLength: matchLen,
  };
}

function queryTokens(query: string): string[] {
  const tokens = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 2);
  return [...new Set(tokens)].sort((a, b) => b.length - a.length);
}

/** Locate full query, then tokens, then prefix-of-word matches. */
function findMatch(
  haystack: string,
  query: string
): { index: number; length: number } | null {
  const q = query.trim();
  if (!q) return null;
  const lower = haystack.toLowerCase();
  const qLower = q.toLowerCase();

  const full = lower.indexOf(qLower);
  if (full >= 0) return { index: full, length: q.length };

  for (const token of queryTokens(q)) {
    const idx = lower.indexOf(token);
    if (idx >= 0) return { index: idx, length: token.length };
  }

  // Prefix: FTS/trigram often matches a longer word than the typed token.
  const wordRe = /\p{L}[\p{L}\p{N}']*/gu;
  let m: RegExpExecArray | null;
  const tokens = queryTokens(q);
  while ((m = wordRe.exec(haystack)) !== null) {
    const word = m[0].toLowerCase();
    for (const token of tokens) {
      if (word.startsWith(token) && word.length >= token.length) {
        return { index: m.index, length: m[0].length };
      }
    }
  }

  return null;
}

function snippetFromField(
  field: string | null | undefined,
  query: string
): MatchSnippet | null {
  const source = field?.trim();
  if (!source) return null;
  const match = findMatch(source, query);
  if (!match) return null;
  return windowAround(source, match.index, match.length);
}

type SnippetItem = {
  name?: string | null;
  teaser?: string | null;
  search_content?: string | null;
  creator?: string | null;
  theme?: string | null;
  label?: string | null;
};

/** First useful match excerpt, or null only when nothing matches. */
export function searchMatchSnippet(
  item: SnippetItem,
  query: string
): MatchSnippet | null {
  const q = query.trim();
  if (q.length < 1) return null;

  // Prefer compact credit/meta fields (e.g. creator "Thor Ronér") before the
  // long search_content blob, so the hit isn’t lost in location noise.
  return (
    snippetFromField(item.creator, q) ||
    snippetFromField(item.label, q) ||
    snippetFromField(item.theme, q) ||
    snippetFromField(item.teaser, q) ||
    snippetFromField(item.name, q) ||
    snippetFromField(item.search_content, q)
  );
}
