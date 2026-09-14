/** Session flag so Play / Info from the browse rail return to the rail without a hero flash. */
export const BROWSE_RETURN_KEY = 'fjorr-return-browse';

export type BrowseReturn = '1' | 'home';

export function peekBrowseReturn(): BrowseReturn | null {
  try {
    const value = sessionStorage.getItem(BROWSE_RETURN_KEY);
    if (value === '1' || value === 'home') return value;
  } catch {
    /* ignore */
  }
  return null;
}

export function setBrowseReturn(value: BrowseReturn) {
  try {
    sessionStorage.setItem(BROWSE_RETURN_KEY, value);
  } catch {
    /* ignore */
  }
}

export function clearBrowseReturn() {
  try {
    sessionStorage.removeItem(BROWSE_RETURN_KEY);
  } catch {
    /* ignore */
  }
}
