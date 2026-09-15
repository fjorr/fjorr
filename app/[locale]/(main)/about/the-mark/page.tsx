import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/config';
import { buildAlternates } from '@/lib/seo/alternates';
import { marketingShareImages } from '@/lib/seo/og';
import MarkClient from './MarkClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('AboutMark');
  const title = t('title');
  const description = t('description');
  const { openGraphImages, twitterImages } = marketingShareImages(title);
  return {
    title,
    description,
    alternates: buildAlternates('/about/the-mark', locale),
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/about/the-mark',
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

export default async function AboutMarkPage() {
  const t = await getTranslations('AboutMark');
  const about = await getTranslations('About');
  return (
    <MarkClient
      backLabel={t('back')}
      logoTitle={about('logoTitle')}
      logoBody={about('logoBody')}
      nameTitle={about('nameTitle')}
      nameBody={about.rich('nameBody', {
        i: (chunks) => <em className="italic">{chunks}</em>,
      })}
    />
  );
}
