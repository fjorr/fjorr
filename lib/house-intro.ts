/** Once per browser — house intro slide on house home. */
export const HOUSE_INTRO_KEY = 'fjorr-house-intro';

export const AMBIENT_INTRO_ID = '__fjorr-intro__';

export function shouldShowHouseIntro(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('intro') === '1') return true;
    return !localStorage.getItem(HOUSE_INTRO_KEY);
  } catch {
    return false;
  }
}

export function markHouseIntroSeen() {
  try {
    localStorage.setItem(HOUSE_INTRO_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function isHouseIntroId(id?: string | null) {
  return id === AMBIENT_INTRO_ID;
}
