import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/config';
import { buildAlternates } from '@/lib/seo/alternates';
import { marketingShareImages } from '@/lib/seo/og';
import HouseScrollFooter from '@/components/HouseScrollFooter';
import SlateBoard from '@/components/SlateBoard';
import { loadSlate } from '@/lib/slate';

export const dynamic = 'force-dynamic';

function formatCycleDate(locale: string, iso: string) {
  const date = new Date(iso);
  const month = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' })
    .format(date)
    .replace(/\./g, '');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${month} ${day}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('Meta');
  const title = t('slateTitle');
  const description = t('slateDescription');
  const { openGraphImages, twitterImages } = marketingShareImages(title);
  return {
    title,
    description,
    alternates: buildAlternates('/slate', locale),
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/slate',
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

export default async function SlatePage() {
  const locale = (await getLocale()) as AppLocale;
  const slate = await loadSlate();
  const cycleDate =
    slate.open && slate.endsAt ? formatCycleDate(locale, slate.endsAt) : null;
  const editionNo = String(slate.edition).padStart(2, '0');

  return (
    <div className="relative flex min-h-[calc(100dvh-56px)] w-full flex-col bg-[#1d1d1d] text-[#F5F5F7]">
      <div className="flex w-full flex-1 flex-col items-center px-6 pb-10 pt-4 md:px-10 md:py-16">
        <div className="flex w-full max-w-[1260px] flex-col">
        <SlateBoard
          open={slate.open}
          stories={slate.stories}
          canVote={slate.canVote}
          selectedId={slate.selectedId}
          cycleDate={cycleDate}
          editionNo={editionNo}
        />
        </div>
      </div>
      <HouseScrollFooter variant="light" surfaceClassName="bg-[#1d1d1d]" />
    </div>
  );
}
