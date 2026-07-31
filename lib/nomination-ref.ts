/**
 * Short public reference for a nomination — derived from id, stable, email-friendly.
 * Example: N-D739036B
 */
export function nominationRefCode(id: string): string {
  const hex = String(id || '')
    .replace(/-/g, '')
    .toUpperCase();
  if (hex.length < 8) return 'N-————';
  return `N-${hex.slice(0, 8)}`;
}
