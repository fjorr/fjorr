import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import MarkClient from './MarkClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('AboutMark');
  const title = t('title');
  const description = t('description');
  return {
    title,
    description,
    alternates: { canonical: '/about/the-mark' },
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/about/the-mark',
      type: 'website',
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
