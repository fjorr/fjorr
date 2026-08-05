import { getTranslations } from 'next-intl/server';
import { ManualEntryArticle } from '@/components/help/ManualEntryArticle';
import ManualMiniSite from '@/components/help/ManualMiniSite';
import type { ManualAudience, ManualEntry } from '@/lib/help/content';

/** Single Manual entry — mini-site card with server-passed article body. */
export default async function ManualEntryView({
  entry,
  audience,
  bureauxNumber,
}: {
  entry: ManualEntry;
  audience: ManualAudience;
  bureauxNumber: number | null;
}) {
  const t = await getTranslations('Help');
  const labels = {
    referenceLabel: t('referenceLabel'),
    referenceAria: t('referenceAria'),
    referenceAriaNamed: t('referenceAriaNamed'),
  };

  return (
    <ManualMiniSite
      mode="page"
      slug={entry.slug}
      audience={audience}
      bureauxNumber={bureauxNumber}
      labels={labels}
    >
      <ManualEntryArticle
        entry={entry}
        audience={audience}
        labels={labels}
        bare
      />
    </ManualMiniSite>
  );
}
