import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import HomePromoGrid from '@/components/HomePromoGrid';
import FeatureRailLoader from '@/components/FeatureRailLoader';
import FeatureRailGate from '@/components/FeatureRailGate';
import CineHomeLoader from '@/components/CineHomeLoader';
import MinimalHomeLoader from '@/components/MinimalHomeLoader';
import TimelineHomeLoader from '@/components/TimelineHomeLoader';
import HomeWithSearch from '@/components/HomeWithSearch';
import HomeBrowseModes from '@/components/HomeBrowseModes';
import HomeMixesLoader from '@/components/HomeMixesLoader';
import HomeMixHero from '@/components/HomeMixHero';
import ServerSafeSkeleton from '@/components/ServerSafeSkeleton';
import { DISPLAY_MODE_COOKIE, parseDisplayMode } from '@/lib/display-mode';
import { SITE_ORIGIN, absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/** Matches FeatureRail shell + aspect so the skeleton never reads larger than the live rail. */
function FeatureRailFallback() {
  return (
    <section className="w-full flex justify-center bg-[var(--page-bg)]" aria-hidden>
      <div className="w-full max-w-[1440px] relative rounded-none min-[1440px]:rounded-xl min-[1440px]:overflow-hidden aspect-[1/1.618] md:aspect-[4/3] lg:aspect-[16/9]">
        <ServerSafeSkeleton
          variant="feature"
          className="rounded-none min-[1440px]:rounded-xl"
        />
      </div>
    </section>
  );
}

/** Matches CineHomeGrid gutters + SearchResultsGrid poster geometry. */
function CineGridFallback() {
  return (
    <div className="w-full px-8 md:px-16 mt-8 md:mt-12" aria-hidden>
      <div className="w-full max-w-[1440px] mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-12">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="w-full aspect-[2/3] rounded-[8px] bg-page-chip"
          />
        ))}
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
  const cookieStore = await cookies();
  const mode = parseDisplayMode(
    cookieStore.get(DISPLAY_MODE_COOKIE)?.value
  );

  // Cookie-gate: only stream the active browse mode. Mode switches write the
  // cookie and router.refresh() so the next RSC payload swaps trees.
  const cinematic =
    mode === 'cinematic' ? (
      <>
        <FeatureRailGate>
          <div className="w-full mt-4 md:mt-6">
            <Suspense fallback={<FeatureRailFallback />}>
              <FeatureRailLoader />
            </Suspense>
          </div>
        </FeatureRailGate>

        <Suspense fallback={<CineGridFallback />}>
          <CineHomeLoader />
        </Suspense>
      </>
    ) : null;

  const minimal =
    mode === 'minimal' ? (
      <Suspense fallback={null}>
        <MinimalHomeLoader />
      </Suspense>
    ) : null;

  const timeline =
    mode === 'timeline' ? (
      <Suspense fallback={null}>
        <TimelineHomeLoader />
      </Suspense>
    ) : null;

  const jsonLd = (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
    />
  );

  return (
    <>
      {jsonLd}
      <HomeWithSearch>
        <Suspense fallback={null}>
          <HomeMixesLoader />
        </Suspense>
        <HomeMixHero />
        <HomeBrowseModes
          cinematic={cinematic}
          minimal={minimal}
          timeline={timeline}
        />
        <Suspense fallback={null}>
          <HomePromoGrid />
        </Suspense>
      </HomeWithSearch>
    </>
  );
}
