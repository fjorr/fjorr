export type DisplayMode = 'cinematic' | 'minimal' | 'timeline';

export const DISPLAY_MODE_COOKIE = 'fjorr-display-mode';

export function parseDisplayMode(value?: string | null): DisplayMode {
  if (value === 'minimal') return 'minimal';
  if (value === 'timeline') return 'timeline';
  return 'cinematic';
}

export function readDisplayModeCookie(): DisplayMode {
  if (typeof document === 'undefined') return 'cinematic';
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${DISPLAY_MODE_COOKIE}=`));
  return parseDisplayMode(match?.split('=')[1]);
}

export function writeDisplayModeCookie(mode: DisplayMode) {
  if (typeof document === 'undefined') return;
  document.cookie = `${DISPLAY_MODE_COOKIE}=${mode}; path=/; max-age=31536000; SameSite=Lax`;
}

/** Cycle Cine → Mini → Time → Cine (sticky chip). */
export function nextDisplayMode(mode: DisplayMode): DisplayMode {
  if (mode === 'cinematic') return 'minimal';
  if (mode === 'minimal') return 'timeline';
  return 'cinematic';
}
