import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/config';
import { buildAlternates } from '@/lib/seo/alternates';
import { marketingShareImages } from '@/lib/seo/og';
import HouseScrollFooter from '@/components/HouseScrollFooter';
import { absoluteUrl } from '@/lib/site';
import { RSS_FEED_PATH } from '@/lib/rss/build-feed';
import SubscribeClient from './SubscribeClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('Meta');
  const title = t('subscribeTitle');
  const description = t('subscribeDescription');
  const { openGraphImages, twitterImages } = marketingShareImages(title);
  return {
    title,
    description,
    alternates: buildAlternates('/subscribe', locale),
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/subscribe',
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

export default async function SubscribePage() {
  return (
    <div className="relative flex min-h-[calc(100dvh-56px)] w-full flex-col bg-white text-[#0B0B0C]">
      <div className="flex w-full flex-1 flex-col items-center justify-center py-16 md:py-20">
        <SubscribeClient feedUrl={absoluteUrl(RSS_FEED_PATH)} />
      </div>
      <HouseScrollFooter />
    </div>
  );
}
