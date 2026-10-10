/**
 * Shared query matching for search — phrase + token-prefix.
 * "bill bow" matches "Bill Bowerman" even when only separate words exist.
 */

export function searchTokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 1);
}

/** True when hay contains the phrase, or every query token prefixes a hay word. */
export function matchesSearchText(haystack: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = haystack.toLowerCase();
  if (hay.includes(q)) return true;

  const qTokens = searchTokens(q);
  if (!qTokens.length) return false;
  const words = searchTokens(hay);
  if (!words.length) return false;

  return qTokens.every((qt) => words.some((w) => w.startsWith(qt)));
}

/** Score how well fields match a query (higher = better). 0 = no match. */
export function scoreSearchFields(
  fields: {
    name?: string | null;
    creator?: string | null;
    teaser?: string | null;
    theme?: string | null;
    year?: string | null;
  },
  query: string
): number {
  const text = query.trim().toLowerCase();
  if (!text) return 1;

  const name = (fields.name || '').toLowerCase();
  const creator = (fields.creator || '').toLowerCase();
  const teaser = (fields.teaser || '').toLowerCase();
  const theme = (fields.theme || '').toLowerCase();
  const hay = [name, creator, teaser, theme].filter(Boolean).join(' ');

  let score = 0;
  if (name === text) score += 100;
  else if (name.startsWith(text)) score += 60;
  else if (name.includes(text)) score += 40;

  if (fields.year && String(fields.year) === text) score += 30;
  if (creator.includes(text)) score += 35;
  if (theme.includes(text)) score += 25;
  if (teaser.includes(text)) score += 15;

  // Token prefixes: "bill bow" → Bill Bowerman
  const qTokens = searchTokens(text);
  if (qTokens.length) {
    const words = searchTokens(hay);
    let prefixHits = 0;
    for (const qt of qTokens) {
      if (words.some((w) => w.startsWith(qt))) prefixHits += 1;
    }
    if (prefixHits === qTokens.length) {
      score += 45 + prefixHits * 8;
    } else if (prefixHits > 0 && qTokens.length === 1) {
      score += 20;
    }
  }

  return score;
}

function snippetTokens(text: string): string[] {
  return searchTokens(text).filter((t) => t.length >= 2);
}

/**
 * Window around the match so the hit word stays visible.
 * Returns null when the source does not contain the query.
 */
export function hitSnippet(
  source: string | null | undefined,
  query: string,
  maxLen = 96
): string | null {
  const q = query.trim().toLowerCase();
  const raw = (source || '').replace(/\s+/g, ' ').trim();
  if (!q || !raw) return null;
  if (!matchesSearchText(raw, q)) return null;

  const lower = raw.toLowerCase();
  let idx = lower.indexOf(q);
  let matchLen = q.length;
  if (idx < 0) {
    const parts = snippetTokens(q).sort((a, b) => b.length - a.length);
    const words = snippetTokens(lower);
    for (const part of parts) {
      const word = words.find((w) => w.startsWith(part));
      if (word) {
        idx = lower.indexOf(word);
        matchLen = word.length;
        break;
      }
      idx = lower.indexOf(part);
      if (idx >= 0) {
        matchLen = part.length;
        break;
      }
    }
  }
  if (idx < 0) return raw.length <= maxLen ? raw : `${raw.slice(0, maxLen).trim()}…`;

  if (raw.length <= maxLen) {
    return raw;
  }

  const side = Math.max(12, Math.floor((maxLen - matchLen) / 2));
  let start = Math.max(0, idx - side);
  let end = Math.min(raw.length, idx + matchLen + side);
  if (end - start < maxLen) {
    const deficit = maxLen - (end - start);
    start = Math.max(0, start - Math.ceil(deficit / 2));
    end = Math.min(raw.length, end + Math.floor(deficit / 2));
  }
  if (start > 0) {
    const space = raw.indexOf(' ', start);
    if (space > start && space < idx) start = space + 1;
  }
  if (end < raw.length) {
    const space = raw.lastIndexOf(' ', end);
    if (space > idx + matchLen) end = space;
  }

  let slice = raw.slice(start, end).trim();
  if (start > 0) slice = `…${slice}`;
  if (end < raw.length) slice = `${slice}…`;
  return slice;
}
