import { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/config';
import { buildAlternates } from '@/lib/seo/alternates';
import { marketingShareImages } from '@/lib/seo/og';
import AboutClient, { type AboutCopy } from './AboutClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('Meta');
  const title = t('aboutTitle');
  const description = t('aboutDescription');
  const { openGraphImages, twitterImages } = marketingShareImages(title);
  return {
    title,
    description,
    alternates: buildAlternates('/about', locale),
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/about',
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About Fjorr',
  description:
    "We're building a myth engine. The world's greatest stories as short films. Under 20 minutes, always. Free for anyone in the world. Fjorr.",
  publisher: {
    '@type': 'Organization',
    name: 'Fjorr',
    url: 'https://www.fjorr.com',
  },
};

const MARK_IMAGE =
  'https://media.fjorr.com/app-assets/animation/icon/fjorr-production-logo-frame-05.avif';

/** One manifesto line = one slide (keeps “Fjorr. The myth engine.” together). */
function buildManifestoBeats(manifesto: string): { text: string }[] {
  return manifesto
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((text) => ({ text }));
}

export default async function AboutPage() {
  const t = await getTranslations('About');
  const partner = await getTranslations('Partner');
  const copy: AboutCopy = {
    manifestoBeats: buildManifestoBeats(t('manifesto')),
    scrollLabel: t('scrollCue'),
    deckHintLead: t('deckHintLead'),
    deckHint: t('deckHint'),
    contactHeadlineLines: [partner('headlineLine1'), partner('headlineLine2')],
    contactBlurb: t('contactBlurb'),
    posters: [
      {
        href: '/about/100-years-of-failure',
        title: t('posterEssayTitle'),
        titleLines: ['100 Years', 'of Failure'],
        tagline: t('posterEssayTagline'),
        image: null,
        video: '/about/fjorr-le-voyage-dans-la-lune-bg.mp4',
      },
      {
        href: '/about/the-mark',
        title: t('posterMarkTitle'),
        tagline: t('posterMarkTagline'),
        image: MARK_IMAGE,
        imageFit: 'contain',
      },
    ],
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
