import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ESSAY_FAILURE_DEK } from '@/lib/content/essay-failure';
import EssayClient from './EssayClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('EssayFailure');
  const title = t('title');
  const description = t('description');
  return {
    title,
    description,
    alternates: { canonical: '/about/100-years-of-failure' },
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/about/100-years-of-failure',
      type: 'article',
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
