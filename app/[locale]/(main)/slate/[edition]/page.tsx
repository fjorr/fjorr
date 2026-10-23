import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/config';
import { buildAlternates } from '@/lib/seo/alternates';
import { marketingShareImages } from '@/lib/seo/og';
import HouseScrollFooter from '@/components/HouseScrollFooter';
import SlateBoard from '@/components/SlateBoard';
import { formatSlateDate, loadSlateEdition } from '@/lib/slate';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ edition: string }>;
}

function editionNumber(raw: string) {
  if (!/^\d{1,2}$/.test(raw)) return null;
  const edition = Number(raw);
  return edition >= 1 ? edition : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { edition: raw } = await params;
  const edition = editionNumber(raw);
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('Meta');
  const slate = await getTranslations('Slate');
  const slateData = edition ? await loadSlateEdition(edition) : null;
  const editionNo = edition ? String(edition).padStart(2, '0') : '';
  const title = slateData ? `${slate('headline')} ${editionNo}` : t('slateTitle');
  const description = t('slateDescription');
  const path = slateData ? `/slate/${editionNo}` : '/slate';
  const { openGraphImages, twitterImages } = marketingShareImages(title);
  return {
    title,
    description,
    alternates: buildAlternates(path, locale),
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: `https://www.fjorr.com${path}`,
      type: 'website',
      images: openGraphImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Fjorr`,
      description,
      images: twitterImages,
    },
  };
}

export default async function SlateEditionPage({ params }: PageProps) {
  const { edition: raw } = await params;
  const edition = editionNumber(raw);
  if (!edition) notFound();
  const slateData = await loadSlateEdition(edition);
  if (!slateData) notFound();

  const locale = (await getLocale()) as AppLocale;
  const editionNo = String(edition).padStart(2, '0');
  const cycleDate = slateData.endsAt ? formatSlateDate(locale, slateData.endsAt) : null;

  return (
    <div className="relative flex min-h-[calc(100dvh-56px)] w-full flex-col bg-white text-[#0B0B0C]">
      <div className="flex w-full flex-1 flex-col">
        <SlateBoard
          open={slateData.open}
          stories={slateData.stories}
          canVote={slateData.canVote}
          selectedId={slateData.selectedId}
          cycleDate={cycleDate}
          editionNo={editionNo}
        />
      </div>
      <HouseScrollFooter />
    </div>
  );
}
