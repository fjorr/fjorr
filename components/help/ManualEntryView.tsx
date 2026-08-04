import ManualMiniSite from '@/components/help/ManualMiniSite';
import type { ManualAudience, ManualEntry } from '@/lib/help/content';

/** Single Manual entry — mini-site card (sticky chrome + in-card index). */
export default function ManualEntryView({
  entry,
  audience,
}: {
  entry: ManualEntry;
  audience: ManualAudience;
  bureauxNumber: number | null;
}) {
  return (
    <ManualMiniSite mode="page" slug={entry.slug} audience={audience} />
  );
}
