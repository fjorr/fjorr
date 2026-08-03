'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface FilmItem {
  name?: string | null;
  slug?: string | null;
  runtime?: number | string | null;
}

interface ArtifactSidebarProps {
  name: string;
  label: string | null;
  creatorName: string;
  releaseYear: number | null;
  description: string | null;
  quote: string | null;
  filmConnections: FilmItem[];
  linkCta: string | null;
  link: string | null;
  isDarkBg: boolean;
  customBg: string;
  textClass: string;
  subTextClass: string;
  mutedTextClass: string;
  borderClass?: string;
  isLoader?: boolean;
}

function formatRuntime(runtime: FilmItem['runtime']): string | null {
  if (runtime === undefined || runtime === null) return null;
  const rawSeconds = typeof runtime === 'string' ? parseInt(runtime, 10) : runtime;
  if (isNaN(rawSeconds) || rawSeconds <= 0) return null;
  return `${Math.ceil(rawSeconds / 60)}m`;
}

export function ArtifactSidebar({
  name,
  label,
  creatorName,
  releaseYear,
  description,
  quote,
  filmConnections,
  linkCta,
  link,
  isDarkBg,
  customBg,
  textClass,
  subTextClass,
  mutedTextClass,
  isLoader = false,
}: ArtifactSidebarProps) {
  const t = useTranslations('Artifact');

  const formatExternalUrl = (url: string | null | undefined): string => {
    if (!url) return '#';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  if (isLoader) {
    const wireframeContentColor = isDarkBg ? 'bg-white/5' : 'bg-black/5';
    const wireframeTitleColor = isDarkBg ? 'bg-white/10' : 'bg-black/10';

    return (
      <div
        style={{ backgroundColor: customBg }}
        className="w-full lg:w-[360px] xl:w-[400px] shrink-0 flex flex-col justify-start lg:justify-center p-8 md:p-10 lg:py-12 h-full select-none"
      >
        <div className="animate-pulse flex flex-col gap-4 w-full">
          <div className={`w-20 h-2.5 ${wireframeContentColor} rounded`} />
          <div className={`w-52 h-7 ${wireframeTitleColor} rounded-lg`} />
          <div className={`w-40 h-3.5 ${wireframeContentColor} rounded mt-1`} />
          <div className={`w-full h-20 ${wireframeContentColor} rounded-lg mt-6`} />
        </div>
      </div>
    );
  }

  const metaLine = [creatorName, label, releaseYear].filter(Boolean).join(' · ');

  return (
    <div
      style={{ backgroundColor: customBg }}
      className={`w-full lg:w-[360px] xl:w-[400px] shrink-0 flex flex-col justify-start lg:justify-center p-8 md:p-10 lg:py-12 h-full ${textClass}`}
    >
      <span
        className={`text-[10px] font-sans font-medium tracking-[0.08em] uppercase mb-3 ${mutedTextClass}`}
      >
        {t('label')}
      </span>

      <h1
        className={`font-sans text-2xl tracking-tight leading-snug font-bold mb-3 ${textClass}`}
      >
        {name}
      </h1>

      {metaLine ? (
        <p className={`font-sans text-sm font-medium leading-snug mb-6 ${subTextClass}`}>
          {metaLine}
        </p>
      ) : null}

      {/* Quote leads when present; description supports */}
      {quote ? (
        <p className={`font-sans text-base font-medium leading-relaxed tracking-normal mb-3 ${textClass}`}>
          {quote}
        </p>
      ) : null}

      {description ? (
        <p
          className={`font-sans text-[15px] font-normal leading-relaxed tracking-normal max-w-lg ${
            quote ? mutedTextClass : subTextClass
          }`}
        >
          {description}
        </p>
      ) : null}

      {filmConnections.length > 0 && (
        <div className="mt-8 pt-6 border-t border-[color-mix(in_srgb,currentColor_8%,transparent)]">
          <span className={`text-[13px] font-medium font-sans tracking-tight ${mutedTextClass}`}>
            {t('relatedFilms')}
          </span>
          <div className="flex flex-col gap-2 mt-3">
            {filmConnections.map((movie, idx) => {
              const displayTitle = movie.name || t('untitled');
              const displayRuntime = formatRuntime(movie.runtime);
              const internalSlug =
                movie.slug ||
                movie.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') ||
                '';

              return (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_auto] gap-x-3 items-baseline"
                >
                  {internalSlug ? (
                    <Link
                      href={`/film/${internalSlug}`}
                      className={`text-sm font-semibold tracking-normal font-sans hover:underline decoration-1 underline-offset-4 transition-opacity hover:opacity-80 ${textClass}`}
                    >
                      {displayTitle}
                    </Link>
                  ) : (
                    <span className={`text-sm font-semibold tracking-normal font-sans ${textClass}`}>
                      {displayTitle}
                    </span>
                  )}
                  {displayRuntime ? (
                    <span className={`text-[12px] font-sans font-medium tabular-nums ${mutedTextClass}`}>
                      {displayRuntime}
                    </span>
                  ) : (
                    <span />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {linkCta && (
        <div className={filmConnections.length > 0 ? 'pt-5' : 'pt-8'}>
          <a
            href={formatExternalUrl(link)}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 font-sans text-[13px] font-medium tracking-[0.05em] uppercase hover:opacity-70 transition-opacity group w-max cursor-pointer ${textClass}`}
          >
            <span>{linkCta}</span>
            <svg
              className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform duration-200"
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
        </div>
      )}
    </div>
  );
}
