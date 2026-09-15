/**
 * Shared query matching for ⌘K / intelligence — phrase + token-prefix.
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
