/** Matches house nav/footer chrome height (54px). */
export const HOUSE_CHROME_PX = 54;

/** Horizontal inset for house film posters. */
export function houseStageSidePx(width: number): number {
  if (width >= 768) return HOUSE_CHROME_PX;
  return 24;
}

/** Tailwind: mobile 24 · md+ 54 (matches chrome height). */
export const HOUSE_STAGE_SIDE_CLASS = 'px-6 md:px-[54px]';
