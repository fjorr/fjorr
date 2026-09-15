import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/config';
import { buildAlternates } from '@/lib/seo/alternates';
import { marketingShareImages } from '@/lib/seo/og';
import { ESSAY_FAILURE_DEK } from '@/lib/content/essay-failure';
import EssayClient from './EssayClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('EssayFailure');
  const title = t('title');
  const description = t('description');
  const { openGraphImages, twitterImages } = marketingShareImages(title);
  return {
    title,
    description,
    alternates: buildAlternates('/about/100-years-of-failure', locale),
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/about/100-years-of-failure',
      type: 'article',
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

export default async function EssayFailurePage() {
  const t = await getTranslations('EssayFailure');
  return (
    <EssayClient
      title={t('title')}
      lead={t('lead') || ESSAY_FAILURE_DEK}
      backLabel={t('back')}
      exploreLabel={t('exploreFjorr')}
    />
  );
}
