import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/config';
import { buildAlternates } from '@/lib/seo/alternates';
import { marketingShareImages } from '@/lib/seo/og';
import HouseScrollFooter from '@/components/HouseScrollFooter';
import SlatePropose from '@/components/SlatePropose';
import { loadSlate } from '@/lib/slate';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('Meta');
  const title = t('slateProposeTitle');
  const description = t('slateProposeDescription');
  const { openGraphImages, twitterImages } = marketingShareImages(title);
  return {
    title,
    description,
    alternates: buildAlternates('/slate/propose', locale),
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/slate/propose',
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

export default async function SlateProposePage() {
  const slate = await loadSlate();

  return (
    <div className="relative flex min-h-[calc(100dvh-56px)] w-full flex-col bg-white text-[#0B0B0C]">
      <div className="flex w-full flex-1 flex-col items-center px-6 py-16 md:px-10 md:py-24">
        <SlatePropose
          open={slate.open}
          canVote={slate.canVote}
          promptsLeft={slate.promptsLeft}
        />
      </div>
      <HouseScrollFooter />
    </div>
  );
}
