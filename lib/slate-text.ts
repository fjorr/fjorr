export type SlateStory = {
  id: string;
  title: string;
  logline: string;
  treatment: string;
  imageUrl: string | null;
  source: 'member' | 'internal';
  memberNumber: number | null;
};

/** Prompt text stored on the slate desk. Empty or over 280 is rejected. */
export function normalizePrompt(input: string): string | null {
  const body = input.trim().replace(/\s+/g, ' ');
  if (!body || body.length > 280) return null;
  return body;
}

export function promptLength(input: string): number {
  return input.trim().replace(/\s+/g, ' ').length;
}
