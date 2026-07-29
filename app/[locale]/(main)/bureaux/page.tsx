import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import BureauxClient from './BureauxClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  const title = t('bureauxTitle');
  const description = t('bureauxDescription');
  return {
    title,
    description,
    alternates: { canonical: '/bureaux' },
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/bureaux',
      type: 'website',
    },
    twitter: {
      title: `${title} | Fjorr`,
      description,
    },
  };
}

export default function BureauxPage() {
  return <BureauxClient />;
}
