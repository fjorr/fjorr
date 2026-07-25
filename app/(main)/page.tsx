import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import PromoSplit from '@/components/PromoSplit';
import FeatureRailLoader from '@/components/FeatureRailLoader';
import FeatureRailGate from '@/components/FeatureRailGate';
import CineHomeLoader from '@/components/CineHomeLoader';
import MinimalHomeLoader from '@/components/MinimalHomeLoader';
import TimelineHomeLoader from '@/components/TimelineHomeLoader';
import HomeWithSearch from '@/components/HomeWithSearch';
import HomeBrowseModes from '@/components/HomeBrowseModes';
import ServerSafeSkeleton from '@/components/ServerSafeSkeleton';
import { getHomeMixes } from '@/lib/content/home';
import { SITE_ORIGIN, absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

function FeatureRailFallback() {
  return (
    <div className="w-full flex justify-center animate-pulse bg-[#1F1F1F]">
      <div className="w-full max-w-[1440px] aspect-[1/1.618] md:aspect-[4/3] lg:aspect-[16/9] overflow-hidden rounded-none min-[1440px]:rounded-xl">
        <ServerSafeSkeleton variant="feature" />
      </div>
    </div>
  );
}

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_ORIGIN}/#organization`,
      name: 'Fjorr',
      url: SITE_ORIGIN,
      description: 'Short films of the world’s greatest stories.',
      logo: absoluteUrl('/opengraph-image.png'),
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_ORIGIN}/#website`,
      name: 'Fjorr',
      url: SITE_ORIGIN,
      description: 'Short films of the world’s greatest stories.',
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_ORIGIN}/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default async function Home() {
  // Cookie still seeds DisplayModeProvider; all three browse trees mount so
  // mode switches stay client-side and instant.
  const mixes = await getHomeMixes();

  const jsonLd = (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
    />
  );

  return (
    <>
      {jsonLd}
      <HomeWithSearch mixes={mixes}>
        <HomeBrowseModes
          cinematic={
            <>
              <FeatureRailGate>
                <div className="w-full mt-6 md:mt-10">
                  <Suspense fallback={<FeatureRailFallback />}>
                    <FeatureRailLoader />
                  </Suspense>
                </div>
              </FeatureRailGate>

              <Suspense fallback={null}>
                <CineHomeLoader />
              </Suspense>

              <FeatureRailGate>
                <div className="mt-12 md:mt-16">
                  <PromoSplit />
                </div>
              </FeatureRailGate>
            </>
          }
          minimal={
            <Suspense fallback={null}>
              <MinimalHomeLoader />
            </Suspense>
          }
          timeline={
            <Suspense fallback={null}>
              <TimelineHomeLoader />
            </Suspense>
          }
        />
      </HomeWithSearch>
    </>
  );
}
