import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ArtifactHouseFooter from '@/components/ArtifactHouseFooter';
import ArtifactExhibit from '@/components/ArtifactExhibit';
import ServerSafeSkeleton from '@/components/ServerSafeSkeleton';
import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';
import { resolveSocialOgImage } from '@/lib/og';
import {
  artifactDateLabel,
  getArtifactColorTokens,
  getArtifactMetadata,
  getArtifactPageData,
  getArtifactSlugs,
  getMoreArtifacts,
  normalizeArtifactSources,
} from '@/lib/content/artifact';
import { getLocale, getTranslations } from 'next-intl/server';
import { parseLocale } from '@/i18n/config';
import { NAV_BAND_PX } from '@/lib/house-chrome';

/** Must be a literal — Next.js cannot analyze imported revalidate values. */
export const revalidate = 300;
export const dynamicParams = true;

interface ArtifactPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getArtifactSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: ArtifactPageProps): Promise<Metadata> {
  const { slug: urlSlug } = await params;
  const locale = parseLocale(await getLocale());
  const t = await getTranslations({ locale, namespace: 'Artifact' });
  const artifact = await getArtifactMetadata(urlSlug, locale);
  if (!artifact) return { title: t('notFound') };
  const titleText = artifact.name;
  const descriptionText = artifact.teaser || t('exploreMeta');
  const canonical = absoluteUrl(`/artifact/${artifact.slug}`);
  const ogImageUrl = await resolveSocialOgImage(artifact.blok_ogrf);
  return {
    title: titleText,
    description: descriptionText,
    alternates: { canonical },
    openGraph: {
      title: `${titleText} | Fjorr`,
      description: descriptionText,
      url: canonical,
      siteName: 'Fjorr',
      type: 'article',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `Archive preview for ${artifact.name}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${titleText} | Fjorr`,
      description: descriptionText,
      images: [ogImageUrl],
    },
  };
}

export default async function DynamicArtifactPage({ params }: ArtifactPageProps) {
  const { slug } = await params;
  const colorTokens = await getArtifactColorTokens(slug);

  const customBg = colorTokens?.primary_color || '#0B0B0C';
  const isDarkBg = colorTokens?.is_dark_bg ?? true;

  const textClass = isDarkBg ? 'text-white' : 'text-black';
  const targetedDotOpacity = isDarkBg ? 0.3 : 0.65;

  return (
    <div
      style={{
        backgroundColor: customBg,
        ['--page-bg-color' as string]: customBg,
      }}
      className={`flex min-h-dvh w-full flex-col transition-colors duration-500 ease-out ${textClass}`}
    >
      <Navbar variant={isDarkBg ? 'light' : 'dark'} />

      <Suspense
        fallback={
          <>
            <main className="relative z-0 w-full flex-1">
              <div
                className="flex w-full flex-col"
                style={{ height: `calc(100dvh - ${NAV_BAND_PX}px)` }}
              >
                <div className="relative min-h-0 flex-1">
                  <div className="absolute inset-0 mx-auto w-full max-w-4xl px-6 md:px-10 lg:px-12">
                    <ServerSafeSkeleton
                      variant="feature"
                      backgroundColor={customBg}
                      isDarkBg={isDarkBg}
                      dotOpacity={targetedDotOpacity}
                      className="h-full"
                    />
                  </div>
                </div>
              </div>
            </main>
            <ArtifactHouseFooter isDarkBg={isDarkBg} pageBg={customBg} />
          </>
        }
      >
        <DeferredArtifactContent
          urlSlug={slug}
          customBg={customBg}
          isDarkBg={isDarkBg}
        />
      </Suspense>
    </div>
  );
}

async function DeferredArtifactContent({
  urlSlug,
  customBg,
  isDarkBg,
}: {
  urlSlug: string;
  customBg: string;
  isDarkBg: boolean;
}) {
  const locale = parseLocale(await getLocale());
  const [pageData, moreArtifacts] = await Promise.all([
    getArtifactPageData(urlSlug, locale),
    getMoreArtifacts(urlSlug, locale),
  ]);
  if (!pageData) notFound();

  const { artifact, creatorName } = pageData;
  const dateLabel = artifactDateLabel(artifact);
  const filmConnections = artifact.film || [];
  const quoteAttribution =
    typeof artifact.quote_attribution === 'string'
      ? artifact.quote_attribution.trim() || null
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: artifact.name,
            description: artifact.description || artifact.teaser,
            image: artifact.blok_ogrf || artifact.hero_tall || 'https://www.fjorr.com/opengraph-image.png',
            dateCreated: artifact.release_date,
            creator: { '@type': 'Person', name: creatorName || 'Fjorr Contributor' },
            publisher: { '@type': 'Organization', name: 'Fjorr' },
          }),
        }}
      />
      <ArtifactExhibit
        name={artifact.name || urlSlug.replace(/-/g, ' ')}
        label={artifact.label}
        creatorName={creatorName}
        dateLabel={dateLabel}
        description={artifact.description || artifact.teaser}
        quote={artifact.quote}
        quoteAttribution={quoteAttribution}
        sources={normalizeArtifactSources(artifact.sources)}
        filmConnections={filmConnections}
        linkCta={artifact.link_cta}
        link={artifact.link}
        heroTall={artifact.hero_tall || null}
        heroClsx={artifact.hero_clsx || null}
        isDarkBg={isDarkBg}
        customBg={customBg}
        moreArtifacts={moreArtifacts}
      />
    </>
  );
}
