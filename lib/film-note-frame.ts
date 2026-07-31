/**
 * Mux still at a playhead — public playback IDs only.
 * Safe for client + server (no Supabase imports).
 */
export function filmNoteFrameUrl(
  playbackId: string | null | undefined,
  atSeconds: number | null | undefined,
  size: 'sm' | 'lg' = 'sm'
): string | null {
  if (!playbackId || atSeconds == null || Number.isNaN(Number(atSeconds))) {
    return null;
  }
  const t = Math.max(0, Math.floor(Number(atSeconds)));
  const width = size === 'lg' ? 640 : 160;
  const height = size === 'lg' ? 360 : 90;
  const params = new URLSearchParams({
    time: String(t),
    width: String(width),
    height: String(height),
    fit_mode: 'crop',
  });
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?${params}`;
}
