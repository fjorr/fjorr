/**
 * Theater chrome experiment switch.
 * - `'classic'` — prior bottom chrome + hairline scrubber (TheaterScrubberClassic)
 * - `'circle'` — centered ring (TheaterCircleControl) — shelved
 * - `'rams'` — chassis UI only: sacred 16:9, full-width 1px track, amber needle
 */
export type TheaterPlayerChromeVariant = 'classic' | 'circle' | 'rams';

export const THEATER_PLAYER_CHROME: TheaterPlayerChromeVariant = 'rams';
