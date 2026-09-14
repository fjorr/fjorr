import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PartnerClient from './PartnerClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  const title = t('partnerTitle');
  const description = t('partnerDescription');
  return {
    title,
    description,
    alternates: { canonical: '/partner' },
    openGraph: {
      title: `${title} with Fjorr`,
      description,
      url: 'https://www.fjorr.com/partner',
      type: 'website',
    },
    twitter: {
      title: `${title} with Fjorr.`,
      description,
    },
  };
}

export default function PartnerPage() {
  return <PartnerClient />;
}
