/**
 * Cinema caption helpers.
 *
 * - formatCaptionText: soft line-wrap for on-screen display (≤2–3 lines)
 * - expandCaptionCuesForDisplay: timed-split long Whisper cues so fewer
 *   words show at once — transcript keeps the original VTT untouched
 */

const ONE_LINE = 56;
const MAX_DISPLAY_LINES = 2;
/** Cues at or under this stay as a single timed block. */
const SHORT_CUE_CHARS = 64;
const SHORT_CUE_WORDS = 14;
/** Target size for each timed chunk. */
const CHUNK_TARGET_CHARS = 52;
const MIN_CHUNK_SECONDS = 1.25;
const MAX_TIMED_CHUNKS = 4;

export type CaptionCue = {
  startTime: number;
  endTime: number;
  text: string;
};

function bestBreakIndex(text: string, preferEnd = false): number {
  const len = text.length;
  const mid = preferEnd ? len * 0.72 : len / 2;
  const lo = Math.floor(len * (preferEnd ? 0.45 : 0.28));
  const hi = Math.ceil(len * (preferEnd ? 0.92 : 0.72));

  const clause = /[,;:!?…]|\s+[—–-]\s+/g;
  let bestClause = -1;
  let bestClauseDist = Infinity;
  let match: RegExpExecArray | null;
  while ((match = clause.exec(text)) !== null) {
    let idx = match.index + match[0].length;
    while (text[idx] === ' ') idx++;
    if (idx <= lo || idx >= hi || idx >= len) continue;
    const dist = Math.abs(idx - mid);
    if (dist < bestClauseDist) {
      bestClauseDist = dist;
      bestClause = idx;
    }
  }
  if (bestClause > 0) return bestClause;

  let bestSpace = -1;
  let bestSpaceDist = Infinity;
  for (let i = lo; i <= Math.min(hi, len - 1); i++) {
    if (text[i] !== ' ') continue;
    const dist = Math.abs(i + 1 - mid);
    if (dist < bestSpaceDist) {
      bestSpaceDist = dist;
      bestSpace = i;
    }
  }
  if (bestSpace > 0) return bestSpace + 1;

  const before = text.lastIndexOf(' ', Math.floor(mid));
  if (before > 0) return before + 1;
  const after = text.indexOf(' ', Math.ceil(mid));
  if (after > 0) return after + 1;
  return -1;
}

function splitBalanced(text: string, maxLines = MAX_DISPLAY_LINES): string[] {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) return [];
  if (trimmed.length <= ONE_LINE) return [trimmed];

  const lines: string[] = [];
  let rest = trimmed;

  while (rest.length > ONE_LINE && lines.length < maxLines - 1) {
    const idx = bestBreakIndex(rest);
    if (idx <= 0 || idx >= rest.length) break;
    const head = rest.slice(0, idx).trim();
    rest = rest.slice(idx).trim();
    if (head) lines.push(head);
    else break;
  }

  if (rest) lines.push(rest);

  if (lines.length > maxLines) {
    return [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(' ')];
  }
  return lines;
}

function normalizeCueText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Soft-wrap a single on-screen caption block. */
export function formatCaptionText(raw: string): string {
  const sourceLines = raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (sourceLines.length === 0) return '';

  if (
    sourceLines.length > 1 &&
    sourceLines.every((l) => l.length <= ONE_LINE + 8)
  ) {
    return sourceLines.slice(0, MAX_DISPLAY_LINES).join('\n');
  }

  return splitBalanced(sourceLines.join(' ')).join('\n');
}

function takeNextChunk(text: string): { chunk: string; rest: string } {
  if (text.length <= CHUNK_TARGET_CHARS + 10) {
    return { chunk: text, rest: '' };
  }

  const window = text.slice(0, Math.min(text.length, Math.floor(CHUNK_TARGET_CHARS * 1.45)));
  const idx = bestBreakIndex(window, true);
  if (idx <= 0 || idx >= text.length) {
    const space = text.lastIndexOf(' ', CHUNK_TARGET_CHARS);
    if (space > 12) {
      return {
        chunk: text.slice(0, space).trim(),
        rest: text.slice(space).trim(),
      };
    }
    return { chunk: text, rest: '' };
  }

  return {
    chunk: text.slice(0, idx).trim(),
    rest: text.slice(idx).trim(),
  };
}

function splitTimedChunks(text: string, maxChunks: number): string[] {
  const normalized = normalizeCueText(text);
  if (!normalized) return [];

  const wordCount = normalized.split(/\s+/).length;
  if (
    maxChunks <= 1 ||
    (normalized.length <= SHORT_CUE_CHARS && wordCount <= SHORT_CUE_WORDS)
  ) {
    return [normalized];
  }

  const chunks: string[] = [];
  let rest = normalized;

  while (chunks.length < maxChunks - 1 && rest) {
    const { chunk, rest: next } = takeNextChunk(rest);
    if (!chunk) break;
    chunks.push(chunk);
    rest = next;
    if (!rest) return chunks;
    if (rest.length <= SHORT_CUE_CHARS && rest.split(/\s+/).length <= SHORT_CUE_WORDS) {
      chunks.push(rest);
      return chunks;
    }
  }

  if (rest) chunks.push(rest);
  return chunks.filter(Boolean);
}

/**
 * Expand VTT cues into timed display segments for the theater overlay.
 * Short cues pass through; long Whisper lines become sequential chunks.
 */
export function expandCaptionCuesForDisplay(cues: CaptionCue[]): CaptionCue[] {
  return cues.flatMap((cue) => {
    const duration = Math.max(0.05, cue.endTime - cue.startTime);
    const maxByTime = Math.max(1, Math.floor(duration / MIN_CHUNK_SECONDS));
    const maxChunks = Math.min(MAX_TIMED_CHUNKS, maxByTime);
    const chunks = splitTimedChunks(cue.text, maxChunks);

    if (chunks.length <= 1) {
      return [
        {
          startTime: cue.startTime,
          endTime: cue.endTime,
          text: formatCaptionText(cue.text),
        },
      ];
    }

    const slice = duration / chunks.length;
    return chunks.map((chunk, i) => ({
      startTime: cue.startTime + i * slice,
      endTime: i === chunks.length - 1 ? cue.endTime : cue.startTime + (i + 1) * slice,
      text: formatCaptionText(chunk),
    }));
  });
}
