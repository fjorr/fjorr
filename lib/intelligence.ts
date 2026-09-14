/**
 * Engine Intelligence dump → ⌘K discovery (notes stay private; API only
 * returns match snippets + seed prompts).
 */

export type IntelligencePortrait = {
  filmId: string;
  slug: string;
  name: string;
  teaser: string | null;
  notes: string;
};

export type IntelligenceMatch = {
  filmId: string;
  slug: string;
  name: string;
  teaser: string | null;
  score: number;
  /** Quiet one-liner — why this matched. Never the full dump. */
  why: string | null;
};

const SEED_HEADER = /discovery\s+seeds/i;

/** Pull quoted / bulleted prompts from the DISCOVERY SEEDS section. */
export function parseDiscoverySeeds(notes: string): string[] {
  if (!notes.trim()) return [];
  const lines = notes.split(/\r?\n/);
  let inSeeds = false;
  const seeds: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inSeeds && seeds.length) break;
      continue;
    }
    if (SEED_HEADER.test(line)) {
      inSeeds = true;
      continue;
    }
    if (!inSeeds) continue;
    // Next ALL-CAPS section header ends seeds
    if (/^[A-Z][A-Z0-9 &/,.-]{6,}$/.test(line) && !line.startsWith('•')) {
      break;
    }
    const quoted = line.match(/[“"]([^”"]+)[”"]/);
    if (quoted?.[1]) {
      seeds.push(quoted[1].trim());
      continue;
    }
    const bullet = line.replace(/^[•\-*]\s*/, '').trim();
    if (bullet && bullet.length > 8 && bullet.length < 120) {
      seeds.push(bullet.replace(/^["“]|["”]$/g, ''));
    }
  }

  return [...new Set(seeds)].slice(0, 6);
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);
}

/** True when the visible snippet still contains the query or a real token. */
export function snippetContainsQuery(snippet: string, query: string): boolean {
  const lower = snippet.toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q || !lower) return false;
  if (lower.includes(q)) return true;
  return tokens(q).some((t) => t.length >= 3 && lower.includes(t));
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

  const lower = raw.toLowerCase();
  let idx = lower.indexOf(q);
  let matchLen = q.length;
  if (idx < 0) {
    const parts = tokens(q)
      .filter((t) => t.length >= 3)
      .sort((a, b) => b.length - a.length);
    for (const part of parts) {
      idx = lower.indexOf(part);
      if (idx >= 0) {
        matchLen = part.length;
        break;
      }
    }
  }
  if (idx < 0) return null;

  if (raw.length <= maxLen) {
    return snippetContainsQuery(raw, q) ? raw : null;
  }

  const side = Math.max(12, Math.floor((maxLen - matchLen) / 2));
  let start = Math.max(0, idx - side);
  let end = Math.min(raw.length, idx + matchLen + side);
  if (end - start < maxLen) {
    const deficit = maxLen - (end - start);
    start = Math.max(0, start - Math.ceil(deficit / 2));
    end = Math.min(raw.length, end + Math.floor(deficit / 2));
  }
  // Prefer cutting on spaces when we add ellipsis
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
  return snippetContainsQuery(slice, q) ? slice : null;
}

export function scoreIntelligence(
  portrait: IntelligencePortrait,
  query: string
): IntelligenceMatch | null {
  const text = query.trim().toLowerCase();
  if (!text) return null;

  const hay = [
    portrait.name,
    portrait.teaser || '',
    portrait.notes,
  ]
    .join('\n')
    .toLowerCase();

  let score = 0;
  if (portrait.name.toLowerCase() === text) score += 100;
  else if (portrait.name.toLowerCase().includes(text)) score += 50;

  if (hay.includes(text)) score += 40;

  const qTokens = tokens(text);
  const noteTokens = new Set(tokens(portrait.notes));
  let hitTokens = 0;
  for (const t of qTokens) {
    if (noteTokens.has(t)) {
      hitTokens += 1;
      score += t.length >= 5 ? 8 : 3;
    }
  }

  // Need a real notes signal for "intelligence" ranking (name-only is local search)
  if (hitTokens === 0 && !portrait.notes.toLowerCase().includes(text)) {
    if (score < 40) return null;
  }

  if (score <= 0) return null;

  return {
    filmId: portrait.filmId,
    slug: portrait.slug,
    name: portrait.name,
    teaser: portrait.teaser,
    score,
    why: hitSnippet(portrait.notes, text) || hitSnippet(portrait.teaser, text),
  };
}

export function rankIntelligence(
  portraits: IntelligencePortrait[],
  query: string
): IntelligenceMatch[] {
  return portraits
    .map((p) => scoreIntelligence(p, query))
    .filter((m): m is IntelligenceMatch => Boolean(m))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export function collectSeeds(portraits: IntelligencePortrait[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of portraits) {
    for (const seed of parseDiscoverySeeds(p.notes)) {
      const key = seed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(seed);
    }
  }
  return out.slice(0, 6);
}
