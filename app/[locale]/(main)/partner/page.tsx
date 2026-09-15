import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/config';
import { buildAlternates } from '@/lib/seo/alternates';
import { marketingShareImages } from '@/lib/seo/og';
import PartnerClient from './PartnerClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('Meta');
  const title = t('partnerTitle');
  const description = t('partnerDescription');
  const { openGraphImages, twitterImages } = marketingShareImages(title);
  return {
    title,
    description,
    alternates: buildAlternates('/partner', locale),
    openGraph: {
      title: `${title} with Fjorr`,
      description,
      url: 'https://www.fjorr.com/partner',
      type: 'website',
      images: openGraphImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} with Fjorr.`,
      description,
      images: twitterImages,
    },
  };
}

export default function PartnerPage() {
  return <PartnerClient />;
}
