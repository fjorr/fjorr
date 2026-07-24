export type VttCue = {
  startSeconds: number;
  endSeconds: number;
  displayTime: string;
  dialogue: string;
};

export function parseVttTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim().split(/\s+/)[0] || '';
  const parts = cleaned.split(':');
  let secs = 0;
  if (parts.length === 3) {
    secs += parseInt(parts[0], 10) * 3600;
    secs += parseInt(parts[1], 10) * 60;
    secs += parseFloat(parts[2]);
  } else if (parts.length === 2) {
    secs += parseInt(parts[0], 10) * 60;
    secs += parseFloat(parts[1]);
  }
  return Number.isFinite(secs) ? secs : 0;
}

export function formatCueClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Parse WebVTT (or VTT-like) text into dialogue cues. */
export function parseVttCues(rawVtt: string | null | undefined): VttCue[] {
  if (!rawVtt?.trim()) return [];

  const normalized = rawVtt.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');

  return normalized
    .split(/\n\s*\n/)
    .filter((block) => block.includes('-->'))
    .map((block) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      const timeRow = lines.find((l) => l.includes('-->')) || '';
      const [startRaw, endRaw] = timeRow.split('-->').map((p) => p.trim());
      const startSeconds = parseVttTimeToSeconds(startRaw || '');
      const endSeconds = parseVttTimeToSeconds(endRaw || '');
      const dialogue = lines
        .slice(lines.findIndex((l) => l.includes('-->')) + 1)
        .join(' ')
        .replace(/<[^>]+>/g, '')
        .trim();

      return {
        startSeconds,
        endSeconds: endSeconds > startSeconds ? endSeconds : startSeconds + 2,
        displayTime: formatCueClock(startSeconds),
        dialogue,
      };
    })
    .filter((cue) => cue.dialogue.length > 0);
}
