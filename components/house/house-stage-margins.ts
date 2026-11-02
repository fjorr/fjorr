/** Matches house nav/footer chrome height (54px). */
export const HOUSE_CHROME_PX = 54;

const clamp = (min: number, value: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Horizontal inset for house film posters. Mirrors `--house-stage-side` in
 * app/globals.css; pass window.innerWidth (vw basis).
 * ≤390 → 24 · 768 → 54 · 1100 → 54 · 1260 → 60 · ≥2000 → 100, linear between.
 */
export function houseStageSidePx(width: number): number {
  return (
    clamp(24, 24 + ((width - 390) * 30) / 378, 54) +
    clamp(0, ((width - 1100) * 6) / 160, 6) +
    clamp(0, ((width - 1260) * 40) / 740, 40)
  );
}

export const HOUSE_STAGE_SIDE_CLASS = 'px-[var(--house-stage-side)]';

/**
 * Extra space between the 54px nav/footer bars and the poster, so top and
 * bottom match the side margin once it grows past 54px (from 768 up).
 */
export const HOUSE_STAGE_VERTICAL_CLASS =
  'py-[max(0px,calc(var(--house-stage-side)_-_54px))]';

/** Total gap above (and below) the poster, nav/footer bar included. Mirrors HOUSE_STAGE_VERTICAL_CLASS. */
export function houseStageVerticalPx(width: number): number {
  return Math.max(HOUSE_CHROME_PX, houseStageSidePx(width));
}

/**
 * Centered reading column under the poster — same 34rem column as the
 * artifact page (ArtifactSheet). The poster itself uses HOUSE_STAGE_SIDE_CLASS.
 */
export const FILM_FRAME_CLASS = 'mx-auto w-full max-w-[calc(34rem+3rem)] px-6';

/** Poster width inside the even viewport margins. */
export function filmPosterWidthPx(width: number): number {
  return Math.max(0, width - houseStageSidePx(width) * 2);
}
