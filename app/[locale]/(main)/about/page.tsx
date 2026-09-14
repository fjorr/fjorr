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
