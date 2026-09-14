'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';

export type ArtifactSheetFilm = {
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

export type ArtifactSheetData = {
  name: string;
  label: string | null;
  creatorName: string;
  releaseYear: number | null;
  description: string | null;
  quote: string | null;
  filmConnections: ArtifactSheetFilm[];
  linkCta: string | null;
  link: string | null;
};

function isFuture(value?: string | null) {
  if (!value) return false;
  return new Date(value).getTime() > Date.now();
}

function pickPoster(film: ArtifactSheetFilm): string | null {
  // Titled landscape — keep display modest so blok_wide stays sharp.
  return film.blok_wide?.trim() || film.blok_tall?.trim() || null;
}

function formatExternalUrl(url: string | null | undefined): string {
  if (!url) return '#';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Artifact Info — continuous with the exhibit ground; centered masthead,
 * then a quiet reading column for quote / body / related posters.
 */
export default function ArtifactSheet({
  artifact,
  onClose,
  pageBg,
  isDarkBg,
}: {
  artifact: ArtifactSheetData;
  onClose: () => void;
  pageBg: string;
  isDarkBg: boolean;
}) {
  const t = useTranslations('Artifact');
  const tFilm = useTranslations('Film');
  const router = useRouter();
  const meta = [artifact.creatorName, artifact.label, artifact.releaseYear]
    .filter(Boolean)
    .join(' · ');

  const ink = isDarkBg ? 'text-white' : 'text-[#0B0B0C]';
  const inkSoft = isDarkBg ? 'text-white/55' : 'text-black/45';
  const inkMute = isDarkBg ? 'text-white/35' : 'text-black/35';
  const inkBody = isDarkBg ? 'text-white/70' : 'text-black/65';
  const posterWell = isDarkBg ? 'bg-white/[0.06]' : 'bg-black/[0.06]';
  const closeIdle = isDarkBg
    ? 'text-white/40 hover:text-white'
    : 'text-black/40 hover:text-black';

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      style={{ backgroundColor: pageBg }}
      className={`fixed inset-x-0 bottom-0 top-[56px] z-20 animate-[sheetIn_280ms_ease-out] overflow-y-auto ${ink}`}
    >
      {/* Sticky dismiss — always reachable while reading. */}
      <div className="sticky top-0 z-10 flex justify-end px-5 pt-3 pointer-events-none md:px-8 md:pt-4">
        <button
          type="button"
          onClick={onClose}
          aria-label={tFilm('keysClose')}
          className={`pointer-events-auto flex h-9 w-9 items-center justify-center transition-colors ${closeIdle}`}
        >
          <span className="text-[24px] leading-none" aria-hidden>
            ×
          </span>
        </button>
      </div>

      <div className="mx-auto w-full max-w-[720px] px-6 pb-14 pt-0 md:px-10 md:pb-16">
        {/* Masthead — one centered composition */}
        <header className="mx-auto max-w-[28rem] text-center md:max-w-[32rem]">
          <p
            className={`font-sans text-[13px] font-medium tracking-normal ${inkMute}`}
          >
            {t('label')}
          </p>
          <h1
            className={`mt-3 font-interTight text-[clamp(2.5rem,7vw,3.75rem)] font-bold leading-[0.92] tracking-[-0.03em] text-balance ${ink}`}
          >
            {artifact.name}
          </h1>
          {meta ? (
            <p
              className={`mt-3 font-sans text-[13px] font-medium tracking-[0.02em] ${inkSoft}`}
            >
              {meta}
            </p>
          ) : null}
        </header>

        {(artifact.quote || artifact.description) ? (
          <section className="mx-auto mt-8 max-w-[34rem] md:mt-10">
            {artifact.quote ? (
              <p
                className={`text-center font-interTight text-[clamp(1.15rem,2.4vw,1.35rem)] font-semibold leading-[1.45] tracking-[-0.015em] text-balance ${ink}`}
              >
                {artifact.quote}
              </p>
            ) : null}
            {artifact.description ? (
              <p
                className={`font-sans text-[16px] font-normal leading-[1.65] tracking-[-0.005em] md:text-[17px] ${inkBody} ${
                  artifact.quote ? 'mt-5' : ''
                }`}
              >
                {artifact.description}
              </p>
            ) : null}
          </section>
        ) : null}

        {artifact.filmConnections.length > 0 ? (
          <section className="mx-auto mt-8 w-full max-w-[34rem] md:mt-10">
            <h2
              className={`mb-3 text-center font-sans text-[13px] font-medium tracking-normal ${inkMute}`}
            >
              {t('relatedFilms')}
            </h2>
            <ul
              className="mx-auto m-0 flex w-full max-w-[18rem] list-none flex-col gap-3 p-0 sm:max-w-[20rem]"
              aria-label={t('relatedFilms')}
            >
              {artifact.filmConnections.map((movie, idx) => {
                const displayTitle = movie.name || t('untitled');
                const comingSoon =
                  Boolean(movie.comingSoon) || isFuture(movie.release_date);
                const thumb = pickPoster(movie);
                const internalSlug =
                  movie.slug ||
                  movie.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') ||
                  '';
                const key =
                  movie.id || movie.slug || `${displayTitle}-${idx}`;

                const card = (
                  <span
                    className={`relative block aspect-[16/9] w-full overflow-hidden rounded-[8px] ${posterWell}`}
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                        draggable={false}
                      />
                    ) : (
                      <span
                        className={`flex h-full items-center justify-center px-3 text-center font-sans text-[12px] font-semibold ${inkMute}`}
                      >
                        {displayTitle}
                      </span>
                    )}
                    {comingSoon ? (
                      <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-[6px] bg-black/55 px-2 py-1 font-sans text-[10px] font-semibold tracking-tight text-white/90 backdrop-blur-md">
                        {tFilm('comingSoon')}
                      </span>
                    ) : null}
                  </span>
                );

                return (
                  <li key={key}>
                    {internalSlug ? (
                      <Link
                        href={`/film/${internalSlug}`}
                        aria-label={displayTitle}
                        className="group block hover:opacity-90"
                        onClick={(event) => {
                          // Always land on the film stage — never carry #info.
                          event.preventDefault();
                          router.push(`/film/${internalSlug}`);
                        }}
                      >
                        {card}
                      </Link>
                    ) : (
                      <div className="block" aria-label={displayTitle}>
                        {card}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {artifact.linkCta ? (
          <section
            className={`mx-auto max-w-[34rem] ${
              artifact.filmConnections.length > 0 ? 'pt-6' : 'mt-8 md:mt-10'
            }`}
          >
            <a
              href={formatExternalUrl(artifact.link)}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold tracking-tight transition-opacity hover:opacity-70 ${ink}`}
            >
              <span>{artifact.linkCta}</span>
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </section>
        ) : null}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes sheetIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `,
        }}
      />
    </div>
  );
}
