'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { storySettingDisplay } from '@/lib/story-year';
import RuntimeTag from '@/components/house/RuntimeTag';

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

export type ArtifactSource = {
  title: string;
  url: string | null;
};

export type ArtifactSheetData = {
  name: string;
  label: string | null;
  creatorName: string;
  dateLabel: string | null;
  description: string | null;
  quote: string | null;
  quoteAttribution: string | null;
  sources: ArtifactSource[];
  filmConnections: ArtifactSheetFilm[];
  linkCta: string | null;
  link: string | null;
};

function isFuture(value?: string | null) {
  if (!value) return false;
  return new Date(value).getTime() > Date.now();
}

/** Vertical titled poster — same art as Browse and More films. */
function pickPoster(film: ArtifactSheetFilm): string | null {
  return (
    film.blok_tall?.trim() ||
    film.hero_tall?.trim() ||
    film.blok_wide?.trim() ||
    null
  );
}

function runtimeLabel(value: ArtifactSheetFilm['runtime']) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return `${Math.max(1, Math.ceil(seconds / 60))}m`;
}

function formatExternalUrl(url: string | null | undefined): string {
  if (!url) return '#';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function attributionLine(value: string) {
  const text = value.trim();
  if (/^[—–-]/.test(text)) return text;
  return `— ${text}`;
}

/**
 * Name and credit. Sits at the bottom of the first screen, under the object.
 */
export function ArtifactMasthead({
  name,
  creatorName,
  label,
  dateLabel,
  isDarkBg,
}: {
  name: string;
  creatorName: string;
  label: string | null;
  dateLabel: string | null;
  isDarkBg: boolean;
}) {
  const t = useTranslations('Artifact');
  const meta = [creatorName, label, dateLabel].filter(Boolean).join(' · ');
  const ink = isDarkBg ? 'text-white' : 'text-[#0B0B0C]';
  const inkSoft = isDarkBg ? 'text-white/55' : 'text-black/45';
  const inkMute = isDarkBg ? 'text-white/35' : 'text-black/35';

  return (
    <header className={`mx-auto w-full max-w-[720px] shrink-0 px-6 pb-6 text-center md:px-10 md:pb-8 ${ink}`}>
      <div className="mx-auto max-w-[28rem] md:max-w-[32rem]">
        <p className={`font-sans text-[13px] font-medium leading-tight tracking-tight ${inkMute}`}>
          {t('label')}
        </p>
        <h1
          className={`mt-2 font-[family-name:var(--font-circular-black)] text-[1.625rem] font-[900] leading-[1.05] tracking-[-0.03em] text-balance md:text-[2rem] ${ink}`}
        >
          {name}
        </h1>
        {meta ? (
          <p className={`mt-2.5 font-sans text-[13px] font-medium leading-tight tracking-tight ${inkSoft}`}>
            {meta}
          </p>
        ) : null}
      </div>
    </header>
  );
}

/**
 * Artifact reading column — quote, overview, related film, sources.
 * Begins just below the first screen.
 */
export default function ArtifactSheet({
  artifact,
  isDarkBg,
}: {
  artifact: ArtifactSheetData;
  isDarkBg: boolean;
}) {
  const t = useTranslations('Artifact');
  const tFilm = useTranslations('Film');
  const router = useRouter();
  const sources = artifact.sources.filter((source) => source.title.trim());

  const ink = isDarkBg ? 'text-white' : 'text-[#0B0B0C]';
  const inkSoft = isDarkBg ? 'text-white/55' : 'text-black/45';
  const inkMute = isDarkBg ? 'text-white/35' : 'text-black/35';
  const inkFoot = isDarkBg ? 'text-white/50' : 'text-black/50';
  const inkBody = isDarkBg ? 'text-white/70' : 'text-black/65';
  const posterWell = isDarkBg ? 'bg-white/[0.06]' : 'bg-black/[0.06]';

  return (
    <div className={`mx-auto w-full max-w-[720px] select-text px-6 pb-16 pt-8 md:px-10 md:pb-20 md:pt-10 ${ink}`}>
        {(artifact.quote || artifact.description || artifact.linkCta) ? (
          <section className="mx-auto max-w-[34rem]">
            {artifact.quote ? (
              <figure className="m-0">
                <blockquote
                  className={`text-center font-[family-name:var(--font-circular)] text-[clamp(1.25rem,2.6vw,1.5rem)] font-[700] leading-[1.35] tracking-[-0.03em] text-balance ${ink}`}
                >
                  {artifact.quote}
                </blockquote>
                {artifact.quoteAttribution ? (
                  <figcaption
                    className={`mx-auto mt-3 max-w-[28rem] text-center font-sans text-[13px] font-medium leading-snug tracking-tight text-balance ${inkSoft}`}
                  >
                    {attributionLine(artifact.quoteAttribution)}
                  </figcaption>
                ) : null}
              </figure>
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
            {artifact.linkCta ? (
              <a
                href={formatExternalUrl(artifact.link)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold tracking-tight transition-opacity hover:opacity-70 ${ink} ${
                  artifact.description || artifact.quote ? 'mt-4' : ''
                }`}
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
            ) : null}
          </section>
        ) : null}

        {artifact.filmConnections.length > 0 ? (
          <section className="mx-auto mt-12 w-full max-w-[34rem] md:mt-14">
            <h2 className="mb-4 text-center font-[family-name:var(--font-circular-black)] text-[1.25rem] font-[900] leading-normal tracking-[-0.03em]">
              {t('relatedFilms')}
            </h2>
            <ul
              className="m-0 flex w-full list-none flex-wrap justify-center gap-3 p-0"
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
                const year = storySettingDisplay(movie.story_date ?? movie.storyDate ?? null) || null;
                const runtime = comingSoon ? null : runtimeLabel(movie.runtime);
                const caption = [year, comingSoon ? tFilm('comingSoon') : runtime]
                  .filter(Boolean)
                  .join(' · ');

                const card = (
                  <span className="block">
                  <span
                    className={`relative block aspect-[2/3] w-full overflow-hidden rounded-[8px] ${posterWell}`}
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
                  </span>
                  {caption ? (
                    <span
                      className={`mt-2 flex min-w-0 items-center gap-1 text-left font-sans text-[12px] font-medium leading-snug tracking-tight ${inkSoft}`}
                    >
                      {year ? <span className="truncate">{year}</span> : null}
                      {comingSoon ? (
                        <span
                          className={`ml-0.5 shrink-0 rounded-full border px-1.5 py-[3px] text-[10px] font-semibold leading-none ${
                            isDarkBg ? 'border-white/25 text-white/70' : 'border-black/15 text-black/60'
                          }`}
                        >
                          {tFilm('comingSoon')}
                        </span>
                      ) : runtime ? (
                        <>
                          {year ? <span aria-hidden>·</span> : null}
                          <RuntimeTag runtime={runtime} />
                        </>
                      ) : null}
                    </span>
                  ) : null}
                  </span>
                );

                return (
                  <li
                    key={key}
                    className="w-[calc((min(34rem,100vw-3rem)-0.75rem)/2)] shrink-0"
                  >
                    {internalSlug ? (
                      <Link
                        href={`/film/${internalSlug}`}
                        aria-label={caption ? `${displayTitle}, ${caption}` : displayTitle}
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

        {sources.length > 0 ? (
          <section
            className={`mx-auto mt-14 max-w-[34rem] border-t pt-5 md:mt-16 ${
              isDarkBg ? 'border-white/15' : 'border-black/10'
            }`}
            aria-label={t('sources')}
          >
            <h2
              className={`font-sans text-[12px] font-medium leading-tight tracking-tight ${inkMute}`}
            >
              {t('sources')}
            </h2>
            <ul className="m-0 mt-2.5 list-none space-y-2 p-0">
              {sources.map((source) => {
                const line = `block font-sans text-[12px] font-normal leading-[1.35] tracking-[-0.005em] ${inkFoot}`;
                return (
                  <li key={source.title}>
                    {source.url ? (
                      <a
                        href={formatExternalUrl(source.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${line} transition-colors ${
                          isDarkBg ? 'hover:text-white' : 'hover:text-[#0B0B0C]'
                        }`}
                      >
                        {source.title}
                      </a>
                    ) : (
                      <p className={line}>{source.title}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
    </div>
  );
}
