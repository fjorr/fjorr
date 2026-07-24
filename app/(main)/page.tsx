import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import FilmRailLoader from '@/components/FilmRailLoader';
import ArtifactRailLoader from '@/components/ArtifactRailLoader';
import PromoSplit from '@/components/PromoSplit';
import FeatureRailLoader from '@/components/FeatureRailLoader';
import MinimalHomeLoader from '@/components/MinimalHomeLoader';
import HomeWithSearch from '@/components/HomeWithSearch';
import ServerSafeSkeleton from '@/components/ServerSafeSkeleton';
import { DISPLAY_MODE_COOKIE, parseDisplayMode } from '@/lib/display-mode';
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
      logo: absoluteUrl('/opengraph-image.png'),
      description: 'Short films of the world’s greatest stories.',
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
  const cookieStore = await cookies();
  const mode = parseDisplayMode(cookieStore.get(DISPLAY_MODE_COOKIE)?.value);

  const jsonLd = (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
    />
  );

  if (mode === 'minimal') {
    return (
      <>
        {jsonLd}
        <HomeWithSearch>
          <Suspense fallback={null}>
            <MinimalHomeLoader />
          </Suspense>
        </HomeWithSearch>
      </>
    );
  }

  return (
    <>
      {jsonLd}
      <HomeWithSearch>
        <div className="w-full mt-6 md:mt-10">
          <Suspense fallback={<FeatureRailFallback />}>
            <FeatureRailLoader />
          </Suspense>
        </div>

        <div className="w-full flex flex-col gap-6 md:gap-10 mt-6 md:mt-10">
          <Suspense fallback={null}>
            <FilmRailLoader title="Latest" />
          </Suspense>
          <Suspense fallback={null}>
            <FilmRailLoader title="Coming Soon" />
          </Suspense>
          <Suspense fallback={null}>
            <ArtifactRailLoader title="Film Artifacts" />
          </Suspense>
        </div>

        <div className="mt-12 md:mt-16">
          <PromoSplit />
        </div>
      </HomeWithSearch>
    </>
  );
}
