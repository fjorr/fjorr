/**
 * Theater chrome experiment switch.
 * - `'classic'` — prior bottom chrome + hairline scrubber (TheaterScrubberClassic)
 * - `'circle'` — centered ring (TheaterCircleControl) — shelved
 * - `'rams'` — chassis UI only: sacred 16:9, full-width 1px track, amber needle
 */
export type TheaterPlayerChromeVariant = 'classic' | 'circle' | 'rams';

export const THEATER_PLAYER_CHROME: TheaterPlayerChromeVariant = 'rams';

/**
 * Rams chrome layout A/B.
 * - `'overlay'` — full player dims to ~20%, controls centered on top
 * - `'plaque'` — hero animates down to thumbnail + controls below
 */
export type RamsChromeLayout = 'overlay' | 'plaque';

/** Fixed A/B assignments for side-by-side testing. */
export const RAMS_LAYOUT_BY_SLUG: Record<string, RamsChromeLayout> = {
  'unexpected-champion': 'plaque',
  shoebox: 'overlay',
};

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (Math.imul(31, h) + slug.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Resolve Rams layout for a film.
 * Fixed for Champion / Shoebox; stable hash for others (no hydration flicker).
 * Pass `override` from `?rams=overlay|plaque` when testing.
 */
export function resolveRamsChromeLayout(
  slug: string | null | undefined,
  override?: string | null
): RamsChromeLayout {
  if (override === 'overlay' || override === 'plaque') return override;
  const key = String(slug || '')
    .trim()
    .toLowerCase();
  if (key && RAMS_LAYOUT_BY_SLUG[key]) return RAMS_LAYOUT_BY_SLUG[key];
  if (!key) return 'overlay';
  return (hashSlug(key) & 1) === 0 ? 'overlay' : 'plaque';
}
