import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/config';
import { buildAlternates } from '@/lib/seo/alternates';
import { marketingShareImages } from '@/lib/seo/og';
import LegalDoc, { type LegalSection } from '@/components/LegalDoc';
import HouseScrollFooter from '@/components/HouseScrollFooter';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('Meta');
  const title = t('privacyTitle');
  const description = t('privacyDescription');
  const { openGraphImages, twitterImages } = marketingShareImages(title);
  return {
    title,
    description,
    alternates: buildAlternates('/privacy', locale),
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/privacy',
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

export default async function PrivacyPage() {
  const t = await getTranslations('Privacy');

  const sections: LegalSection[] = [
    {
      title: t('s1Title'),
      paragraphs: [t('s1p1'), t('s1p2'), t('s1p3')],
    },
    {
      title: t('s2Title'),
      paragraphs: [t('s2p1'), t('s2p2')],
    },
    {
      title: t('s3Title'),
      paragraphs: [t('s3p1'), t('s3p2'), t('s3p3'), t('s3p4'), t('s3p5')],
    },
    {
      title: t('s4Title'),
      paragraphs: [t('s4p1'), t('s4p2')],
    },
    {
      title: t('s5Title'),
      paragraphs: [t('s5Body')],
    },
    {
      title: t('s6Title'),
      paragraphs: [t('s6p1'), t('s6p2'), t('s6p3')],
    },
    {
      title: t('s7Title'),
      paragraphs: [t('s7p1'), t('s7p2')],
    },
    {
      title: t('s8Title'),
      paragraphs: [t('s8p1'), t('s8p2')],
    },
    {
      title: t('s9Title'),
      paragraphs: [t('s9Body')],
    },
    {
      title: t('s10Title'),
      paragraphs: [t('s10Body')],
    },
    {
      title: t('s11Title'),
      paragraphs: [t('s11Body')],
    },
    {
      title: t('s12Title'),
      paragraphs: [t('s12p1'), t('s12p2'), t('s12p3')],
    },
    {
      title: t('s13Title'),
      bullets: [
        t('s13Item1'),
        t('s13Item2'),
        t('s13Item3'),
        t('s13Item4'),
        t('s13Item5'),
        t('s13Item6'),
        t('s13Item7'),
        t('s13Item8'),
      ],
    },
    {
      title: t('s14Title'),
      paragraphs: [t('s14Body')],
    },
    {
      title: t('s15Title'),
      paragraphs: [t('s15Body')],
    },
    {
      title: t('s16Title'),
      paragraphs: [t('s16Body')],
      after: (
        <a
          href="mailto:control@fjorr.com"
          className="text-[#0B0B0C] underline decoration-black/25 underline-offset-4 transition-colors hover:decoration-black/55"
        >
          control@fjorr.com
        </a>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-white text-[#0B0B0C]">
      <div className="flex w-full flex-1 flex-col">
        <LegalDoc
          title={t('title')}
          lastUpdatedLabel={t('lastUpdated')}
          date={t('date')}
          sections={sections}
        />
      </div>
      <HouseScrollFooter />
    </div>
  );
}
