import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import HouseScrollFooter from '@/components/HouseScrollFooter';
import { absoluteUrl } from '@/lib/site';
import { RSS_FEED_PATH } from '@/lib/rss/build-feed';
import SubscribeClient from './SubscribeClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('subscribeTitle'),
    description: t('subscribeDescription'),
    alternates: { canonical: '/subscribe' },
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
