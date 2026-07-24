/**
 * Allowlist-style cleanup for CMS title-art SVG markup.
 * Rejects non-SVG payloads and strips common XSS vectors.
 */
export function sanitizeTitleArtSvg(html: string | null | undefined): string | null {
  if (!html) return null;
  const trimmed = html.trim();
  if (!trimmed || !/<svg[\s>]/i.test(trimmed)) return null;

  const cleaned = trimmed
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?script\b[^>]*>/gi, '')
    .replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<\/?foreignObject\b[^>]*>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<\/?iframe\b[^>]*>/gi, '')
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|xlink:href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1=$2$2')
    .replace(/data:\s*text\/html/gi, 'data:blocked')
    .replace(/expression\s*\(/gi, '');

  if (!/<svg[\s>]/i.test(cleaned)) return null;
  return cleaned;
}
