export type SlateStory = {
  id: string;
  title: string;
  logline: string;
  treatment: string;
  imageUrl: string | null;
  source: 'member' | 'internal';
  memberNumber: number | null;
};

export const TITLE_MAX = 50;
export const PROMPT_MIN = 40;
export const PROMPT_MAX = 500;

/** Working title. Empty or over 50 characters is rejected. */
export function normalizeTitle(input: string): string | null {
  const title = input.trim().replace(/\s+/g, ' ');
  if (!title || title.length > TITLE_MAX) return null;
  return title;
}

/** Story. Under 40 characters, empty, or over 500 characters is rejected. */
export function normalizePrompt(input: string): string | null {
  const body = input.trim().replace(/\s+/g, ' ');
  if (body.length < PROMPT_MIN || body.length > PROMPT_MAX) return null;
  return body;
}

export function promptLength(input: string): number {
  return input.trim().replace(/\s+/g, ' ').length;
}
