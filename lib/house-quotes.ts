/**
 * House style is straight double quotes. Translators swap them for
 * guillemets (« »), German quotes, or corner brackets.
 */
export function houseQuotes(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value
    .replace(/\s*«\s*/g, '"')
    .replace(/\s*»\s*/g, '"')
    .replace(/\s*‹\s*/g, '"')
    .replace(/\s*›\s*/g, '"')
    .replace(/[„“”‟〝〞]/g, '"')
    .replace(/[「」『』]/g, '"');
}
