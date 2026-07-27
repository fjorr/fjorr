import type { VttCue } from '@/lib/vtt';
import { parseVttCues } from '@/lib/vtt';

const cueCache = new Map<string, VttCue[]>();
const inflight = new Map<string, Promise<VttCue[]>>();

function cacheKey(code: string, urlOrBody: string) {
  return `${code}::${urlOrBody.slice(0, 120)}`;
}

/** Fetch + parse VTT once per URL/body for the browser session. */
export async function loadVttCues(code: string, vttUrlOrBody: string): Promise<VttCue[]> {
  const key = cacheKey(code, vttUrlOrBody);
  const hit = cueCache.get(key);
  if (hit) return hit;

  const pending = inflight.get(key);
  if (pending) return pending;

  const job = (async () => {
    let text = vttUrlOrBody;
    const looksLikeUrl =
      text.trim().startsWith('http') || /\.vtt(\?|$)/i.test(text.trim());
    if (looksLikeUrl) {
      const res = await fetch(text.trim());
      if (!res.ok) throw new Error(`VTT fetch failed: ${res.status}`);
      text = await res.text();
    }
    const cues = parseVttCues(text);
    cueCache.set(key, cues);
    return cues;
  })();

  inflight.set(key, job);
  try {
    return await job;
  } finally {
    inflight.delete(key);
  }
}

export function clearVttCueCache() {
  cueCache.clear();
  inflight.clear();
}
