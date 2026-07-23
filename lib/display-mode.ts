export type DisplayMode = 'cinematic' | 'minimal';

export const DISPLAY_MODE_COOKIE = 'fjorr-display-mode';

export function parseDisplayMode(value?: string | null): DisplayMode {
  return value === 'minimal' ? 'minimal' : 'cinematic';
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
