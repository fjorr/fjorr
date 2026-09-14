'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import ArtifactHouseFooter from '@/components/ArtifactHouseFooter';
import ArtifactSheet from '@/components/house/ArtifactSheet';
import { useHouseOverlay } from '@/components/HouseOverlayProvider';

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
  releaseYear: number | null;
  description: string | null;
  quote: string | null;
  filmConnections: FilmItem[];
  linkCta: string | null;
  link: string | null;
  heroTall: string | null;
  heroClsx: string | null;
  isDarkBg: boolean;
  customBg: string;
  textClass: string;
};

/** Object-first artifact stage — details open as a ground-matched Info sheet. */
export default function ArtifactExhibit({
  name,
  label,
  creatorName,
  releaseYear,
  description,
  quote,
  filmConnections,
  linkCta,
  link,
  heroTall,
  heroClsx,
  isDarkBg,
  customBg,
  textClass,
}: Props) {
  const t = useTranslations('Artifact');
  const { active, close } = useHouseOverlay();
  const [infoOpen, setInfoOpen] = useState(false);
  const src = heroTall || heroClsx;

  const openInfo = useCallback(() => {
    close();
    setInfoOpen(true);
  }, [close]);

  const closeInfo = useCallback(() => setInfoOpen(false), []);

  useEffect(() => {
    if (active != null) setInfoOpen(false);
  }, [active]);

  const infoPill =
    isDarkBg
      ? infoOpen
        ? 'border-white/30 bg-white/20 text-white'
        : 'border-white/25 bg-white/12 text-white/90 hover:bg-white/18 hover:text-white'
      : infoOpen
        ? 'border-black/20 bg-black/10 text-black'
        : 'border-black/15 bg-black/[0.06] text-black/80 hover:bg-black/10 hover:text-black';

  return (
    <>
      <main className="relative z-0 flex min-h-0 w-full flex-1 flex-col text-current">
        <div className="relative z-0 flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-5 p-6 md:gap-6 md:p-10 lg:p-12">
          {src ? (
            <picture className="flex min-h-0 w-full max-w-4xl flex-1 items-center justify-center">
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
                className="mx-auto block h-auto max-h-full w-full object-contain"
              />
            </picture>
          ) : null}

          {!infoOpen ? (
            <div className="flex w-full max-w-4xl shrink-0 flex-col items-center gap-3 px-1 text-center">
              <span
                className={`max-w-full truncate font-interTight text-[15px] font-bold tracking-tight md:text-[16px] ${textClass}`}
              >
                {name}
              </span>
              <button
                type="button"
                aria-label={t('info')}
                aria-expanded={false}
                onClick={openInfo}
                className={`inline-flex h-8 shrink-0 items-center rounded-full border px-3.5 font-sans text-[13px] font-semibold tracking-tight backdrop-blur-md transition-colors ${infoPill}`}
              >
                {t('info')}
              </button>
            </div>
          ) : null}
        </div>
      </main>

      {!infoOpen ? (
        <ArtifactHouseFooter isDarkBg={isDarkBg} pageBg={customBg} />
      ) : null}

      {infoOpen ? (
        <ArtifactSheet
          artifact={{
            name,
            label,
            creatorName,
            releaseYear,
            description,
            quote,
            filmConnections,
            linkCta,
            link,
          }}
          pageBg={customBg}
          isDarkBg={isDarkBg}
          onClose={closeInfo}
        />
      ) : null}
    </>
  );
}
