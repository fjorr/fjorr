import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/config';
import { buildAlternates } from '@/lib/seo/alternates';
import { marketingShareImages } from '@/lib/seo/og';
import HouseScrollFooter from '@/components/HouseScrollFooter';
import SearchPageClient from './SearchPageClient';

type Props = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('Meta');
  const title = t('searchTitle');
  const description = t('searchDescription');
  const { openGraphImages, twitterImages } = marketingShareImages(title);
  return {
    title,
    description,
    alternates: buildAlternates('/search', locale),
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/search',
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

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = params.q;
  const initialQuery = (Array.isArray(raw) ? raw[0] : raw)?.trim() || '';

  return (
    <div className="relative flex min-h-[calc(100dvh-56px)] w-full flex-col bg-white text-[#0B0B0C]">
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <SearchPageClient initialQuery={initialQuery} />
      </div>
      <HouseScrollFooter />
    </div>
  );
}
