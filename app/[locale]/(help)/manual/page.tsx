import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ManualMiniSite from '@/components/help/ManualMiniSite';
import { getManualViewer } from '@/lib/help/audience';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('helpTitle'),
    description: t('helpDescription'),
    alternates: { canonical: '/manual' },
  };
}

/** Manual home — curse-word intro card; Menu opens the index. */
export default async function ManualIndexPage() {
  const viewer = await getManualViewer();
  return (
    <div className="w-full min-h-[calc(100dvh-1.5rem)] sm:min-h-[min(72dvh,36rem)] flex items-center justify-center">
      <ManualMiniSite
        mode="page"
        slug={null}
        audience={viewer.audience}
      />
    </div>
  );
}
