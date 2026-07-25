/**
 * Parse free-text story dates into sortable astronomical years.
 * Negative = BC. Prefer the original Supabase string for display labels.
 */

export function parseStoryYear(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;

  const isBc = /\b(b\.?\s*c\.?\s*e?\.?|before\s+christ)\b/i.test(text);

  const century = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s*centur(?:y|ies)/i);
  if (century) {
    const n = Number(century[1]);
    if (!Number.isFinite(n) || n < 1) return null;
    const start = (n - 1) * 100;
    return isBc ? -(start + 99) : start;
  }

  const withEra = text.match(
    /(?:c\.?\s*|circa\s*|~)?\s*(-?\d{1,4})\s*(b\.?\s*c\.?\s*e?\.?|a\.?\s*d\.?|c\.?\s*e\.?)/i,
  );
  if (withEra) {
    const n = Math.abs(Number(withEra[1]));
    if (!Number.isFinite(n)) return null;
    const era = withEra[2].replace(/\s|\./g, '').toLowerCase();
    if (era.startsWith('b')) return -n;
    return n;
  }

  const range = text.match(/(?:c\.?\s*|circa\s*|~)?\s*(-?\d{3,4})\s*[-–—]\s*(-?\d{2,4})/);
  if (range) {
    const a = Number(range[1]);
    if (!Number.isFinite(a)) return null;
    return isBc ? -Math.abs(a) : a;
  }

  const bare = text.match(/(?:c\.?\s*|circa\s*|~)?\s*(-?\d{3,4})\b/);
  if (bare) {
    const n = Number(bare[1]);
    if (!Number.isFinite(n)) return null;
    return isBc ? -Math.abs(n) : n;
  }

  return null;
}

/** Fallback when no usable raw label exists. */
export function formatStoryYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BC`;
  return String(year);
}

/**
 * Build a display label from the Supabase story_date string.
 * Keeps BC / AD as stored (normalizes BCE → BC).
 */
export function displayLabelFromRaw(
  raw: string | null | undefined,
  year: number,
): string {
  const text = raw == null ? '' : String(raw).trim();
  if (!text) return formatStoryYear(year);

  const withEra = text.match(
    /(-?\d{1,4})\s*(b\.?\s*c\.?\s*e?\.?|a\.?\s*d\.?|c\.?\s*e\.?)/i,
  );
  if (withEra) {
    const n = Math.abs(Number(withEra[1]));
    const era = withEra[2].replace(/\s|\./g, '').toLowerCase();
    if (era.startsWith('b')) return `${n} BC`;
    if (era.startsWith('a') || era === 'ce') return `${n} AD`;
  }

  // Raw had no era — use numeric year only (don't invent AD/BC).
  if (year < 0) return `${Math.abs(year)} BC`;
  return String(Math.abs(year) || year);
}

function labelRank(label: string): number {
  // Prefer labels that include an era suffix from Supabase.
  if (/\bAD\b/i.test(label)) return 2;
  if (/\bBC\b/i.test(label)) return 2;
  return 1;
}

export type StoryYearGroup<T> = {
  year: number | null;
  label: string;
  films: T[];
};

export function groupByStoryYear<T>(
  items: T[],
  getRawDate: (item: T) => string | null | undefined,
  undatedLabel = 'Undated',
): StoryYearGroup<T>[] {
  const map = new Map<number | 'undated', { films: T[]; label: string }>();

  for (const item of items) {
    const raw = getRawDate(item);
    const year = parseStoryYear(raw);
    const key: number | 'undated' = year == null ? 'undated' : year;

    if (key === 'undated') {
      const bucket = map.get('undated');
      if (bucket) bucket.films.push(item);
      else map.set('undated', { films: [item], label: undatedLabel });
      continue;
    }

    const nextLabel = displayLabelFromRaw(raw, key);
    const bucket = map.get(key);
    if (bucket) {
      bucket.films.push(item);
      if (labelRank(nextLabel) > labelRank(bucket.label)) {
        bucket.label = nextLabel;
      }
    } else {
      map.set(key, { films: [item], label: nextLabel });
    }
  }

  const dated: StoryYearGroup<T>[] = [...map.entries()]
    .filter((entry): entry is [number, { films: T[]; label: string }] => entry[0] !== 'undated')
    .sort((a, b) => a[0] - b[0])
    .map(([year, bucket]) => ({
      year,
      label: bucket.label,
      films: bucket.films,
    }));

  const undated = map.get('undated');
  if (undated && undated.films.length > 0) {
    dated.push({
      year: null,
      label: undated.label,
      films: undated.films,
    });
  }

  return dated;
}
