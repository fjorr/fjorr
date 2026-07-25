/**
 * Parse free-text story dates into sortable astronomical years.
 * BCE → negative. Keep original string for display; use this for order/group.
 */

export function parseStoryYear(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;

  const isBce = /\b(b\.?\s*c\.?\s*e?\.?|before\s+christ)\b/i.test(text);

  const century = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s*centur(?:y|ies)/i);
  if (century) {
    const n = Number(century[1]);
    if (!Number.isFinite(n) || n < 1) return null;
    const start = (n - 1) * 100;
    return isBce ? -(start + 99) : start;
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
    return isBce ? -Math.abs(a) : a;
  }

  const bare = text.match(/(?:c\.?\s*|circa\s*|~)?\s*(-?\d{3,4})\b/);
  if (bare) {
    const n = Number(bare[1]);
    if (!Number.isFinite(n)) return null;
    return isBce ? -Math.abs(n) : n;
  }

  return null;
}

export function formatStoryYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return String(year);
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
  const map = new Map<number | 'undated', T[]>();

  for (const item of items) {
    const year = parseStoryYear(getRawDate(item));
    const key: number | 'undated' = year == null ? 'undated' : year;
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }

  const dated = [...map.entries()]
    .filter((entry): entry is [number, T[]] => entry[0] !== 'undated')
    .sort((a, b) => a[0] - b[0])
    .map(([year, films]) => ({
      year,
      label: formatStoryYear(year),
      films,
    }));

  const undated = map.get('undated');
  if (undated?.length) {
    dated.push({ year: null, label: undatedLabel, films: undated });
  }

  return dated;
}
