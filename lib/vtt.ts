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
      // Theater overlay keeps intentional cue line breaks; transcript search still works.
      const dialogue = lines
        .slice(lines.findIndex((l) => l.includes('-->')) + 1)
        .join('\n')
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

/**
 * Binary search for the active cue at `timeSeconds`.
 * Cues must be sorted by startSeconds (parseVttCues order is fine).
 */
export function findActiveCue(
  cues: VttCue[],
  timeSeconds: number
): VttCue | null {
  if (!cues.length) return null;
  let lo = 0;
  let hi = cues.length - 1;
  let candidate: VttCue | null = null;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const cue = cues[mid];
    if (timeSeconds < cue.startSeconds) {
      hi = mid - 1;
    } else {
      candidate = cue;
      lo = mid + 1;
    }
  }

  if (!candidate) return null;
  if (timeSeconds >= candidate.startSeconds && timeSeconds <= candidate.endSeconds) {
    return candidate;
  }
  return null;
}

/** Advancing pointer while playing forward — O(1) amortized. */
export function advanceActiveCueIndex(
  cues: VttCue[],
  timeSeconds: number,
  fromIndex: number
): { index: number; cue: VttCue | null } {
  if (!cues.length) return { index: -1, cue: null };

  let i = Math.max(0, Math.min(fromIndex, cues.length - 1));
  if (fromIndex < 0) i = 0;

  while (i + 1 < cues.length && timeSeconds >= cues[i + 1].startSeconds) i++;
  while (i > 0 && timeSeconds < cues[i].startSeconds) i--;

  const cue = cues[i];
  if (timeSeconds >= cue.startSeconds && timeSeconds <= cue.endSeconds) {
    return { index: i, cue };
  }
  return { index: i, cue: null };
}
