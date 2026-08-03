import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AboutClient, { type AboutCopy } from './AboutClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  const title = t('aboutTitle');
  const description = t('aboutDescription');
  return {
    title,
    description,
    alternates: { canonical: '/about' },
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/about',
      type: 'website',
    },
    twitter: {
      title: `${title} | Fjorr`,
      description,
    },
  };
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About Fjorr',
  description:
    "We are building a myth engine. Short, cinematic films about the world’s greatest stories designed to form imagination, character, and cultural literacy.",
  publisher: {
    '@type': 'Organization',
    name: 'Fjorr',
    url: 'https://www.fjorr.com',
  },
};

export default async function AboutPage() {
  const t = await getTranslations('About');
  const copy: AboutCopy = {
    heroLines: t('hero').split('\n').filter(Boolean),
    manifestoHeadline: t('manifestoHeadline'),
    manifestoParagraphs: t('manifesto')
      .split(/\n\n+/)
      .map((p) => p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean),
    logoLabel: t('logoLabel'),
    logoTitle: t('logoTitle'),
    logoBody: t('logoBody'),
    nameLabel: t('nameLabel'),
    nameTitle: t('nameTitle'),
    nameBody: t.rich('nameBody', {
      i: (chunks) => <em className="italic">{chunks}</em>,
    }),
    exploreFjorr: t('exploreFjorr'),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AboutClient copy={copy} />
    </>
  );
}
