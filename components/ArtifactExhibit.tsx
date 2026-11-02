'use client';

import React from 'react';
import Image from 'next/image';
import ArtifactHouseFooter from '@/components/ArtifactHouseFooter';
import ArtifactSheet, { ArtifactMasthead } from '@/components/house/ArtifactSheet';
import ArtifactMoreRail from '@/components/house/ArtifactMoreRail';
import { NAV_BAND_PX } from '@/lib/house-chrome';
import type { MoreArtifact } from '@/lib/content/artifact';

type FilmItem = {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  runtime?: number | string | null;
  story_date?: string | null;
  storyDate?: string | null;
  release_date?: string | null;
  comingSoon?: boolean;
  blok_wide?: string | null;
  blok_tall?: string | null;
  hero_clsx?: string | null;
  hero_tall?: string | null;
  hero_wide?: string | null;
  thumb?: string | null;
  poster?: string | null;
};

type Props = {
  name: string;
  label: string | null;
  creatorName: string;
  dateLabel: string | null;
  description: string | null;
  quote: string | null;
  quoteAttribution: string | null;
  sources: { title: string; url: string | null }[];
  filmConnections: FilmItem[];
  linkCta: string | null;
  link: string | null;
  heroTall: string | null;
  heroClsx: string | null;
  isDarkBg: boolean;
  customBg: string;
  moreArtifacts: MoreArtifact[];
};

/** Object at the top. The reading follows on the same scroll. */
export default function ArtifactExhibit({
  name,
  label,
  creatorName,
  dateLabel,
  description,
  quote,
  quoteAttribution,
  sources,
  filmConnections,
  linkCta,
  link,
  heroTall,
  heroClsx,
  isDarkBg,
  customBg,
  moreArtifacts,
}: Props) {
  const src = heroTall || heroClsx;

  return (
    <>
      <main className="relative z-0 w-full text-current">
        <div
          className="flex flex-col"
          style={{ height: `calc(100dvh - ${NAV_BAND_PX}px)` }}
        >
          {src ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="relative min-h-0 flex-1">
                <div className="absolute inset-0 flex items-center justify-center px-6 md:px-10 lg:px-12">
                  <picture className="flex h-full w-full max-w-4xl items-center justify-center">
                    {(heroClsx || heroTall) && (
                      <source
                        media="(min-width: 768px)"
                        srcSet={heroClsx || heroTall || ''}
                      />
                    )}
                    <Image
                      src={src}
                      alt={name || 'Fjorr Artifact Screen'}
                      width={1600}
                      height={2400}
                      priority
                      sizes="(max-width: 1024px) 100vw, 70vw"
                      className="block h-full w-full object-contain object-center"
                    />
                  </picture>
                </div>
              </div>
              <div className="h-8 shrink-0 md:h-10" aria-hidden />
            </div>
          ) : (
            <div className="min-h-0 flex-1" />
          )}

          <ArtifactMasthead
            name={name}
            label={label}
            creatorName={creatorName}
            dateLabel={dateLabel}
            isDarkBg={isDarkBg}
          />
        </div>

        <ArtifactSheet
          artifact={{
            name,
            label,
            creatorName,
            dateLabel,
            description,
            quote,
            quoteAttribution,
            sources,
            filmConnections,
            linkCta,
            link,
          }}
          isDarkBg={isDarkBg}
        />

        <ArtifactMoreRail artifacts={moreArtifacts} isDarkBg={isDarkBg} />
      </main>

      <ArtifactHouseFooter isDarkBg={isDarkBg} pageBg={customBg} />
    </>
  );
}
