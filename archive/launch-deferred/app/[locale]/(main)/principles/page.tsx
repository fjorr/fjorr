import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PrinciplesClient from './PrinciplesClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  const title = t('principlesTitle');
  const description = t('principlesDescription');
  return {
    title,
    description,
    alternates: { canonical: '/principles' },
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/principles',
      type: 'website',
    },
    twitter: {
      title: `${title} | Fjorr`,
      description,
    },
  };
}

export default function PrinciplesPage() {
  return <PrinciplesClient />;
}
