import type { ManualAudience, ManualEntry } from '@/lib/help/content';

/** State-aware WHO line — members see their seat where it matters. */
export function manualWhoLine(
  entry: ManualEntry,
  audience: ManualAudience,
  bureauxNumber: number | null
): string {
  const base = entry.who[audience];
  if (audience !== 'member' || bureauxNumber == null) return base;

  switch (entry.slug) {
    case 'join':
      return `You are in. Bureaux № ${bureauxNumber}.`;
    case 'account':
      return `Bureaux № ${bureauxNumber}. Voyages, nominations, and privacy — yours.`;
    case 'voyages':
      return `Bureaux № ${bureauxNumber}. Your Voyageur numbers accumulate here.`;
    case 'cancel':
      return `Bureaux № ${bureauxNumber}. Cancel anytime; the number is kept.`;
    case 'plus':
      return `Bureaux № ${bureauxNumber}. Notes from inside the film, to Fjorr alone.`;
    case 'nominate':
      return `Bureaux № ${bureauxNumber}. Quality over volume. Caps apply.`;
    default:
      return base;
  }
}
