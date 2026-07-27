/**
 * Theater chrome experiment switch.
 * - `'classic'` — prior bottom chrome + hairline scrubber (TheaterScrubberClassic)
 * - `'circle'` — centered ring (TheaterCircleControl) — shelved
 * - `'rams'` — plaque chrome: hero shrinks to thumbnail + controls (default)
 */
export type TheaterPlayerChromeVariant = 'classic' | 'circle' | 'rams';

export const THEATER_PLAYER_CHROME: TheaterPlayerChromeVariant = 'rams';
