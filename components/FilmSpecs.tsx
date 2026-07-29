'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

const FilmTranscript = dynamic(() => import('./FilmTranscript'), {
  ssr: false,
  loading: () => (
    <div className="mt-2 h-8 w-28 rounded bg-page-chip/60 animate-pulse" aria-hidden />
  ),
});

interface TranscriptRow {
  language_code: string;
  content: string;
}

interface CreatorMapRow {
  role: string;
  creator: {
    name: string;
  } | null;
}

interface FilmSpecsProps {
  film: any;
  audioLanguages: string[];
  subtitles: Array<{ name: string; code: string; vtt_url?: string }>;
  tags: string[];
  creators?: CreatorMapRow[];
  onSeek?: (seconds: number) => void;
}

function SpecRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: React.ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] sm:grid-cols-[8.5rem_1fr] gap-x-3 items-baseline text-sm">
      <span className="text-page-faint font-medium">{label}</span>
      <span className={emphasize ? 'text-page font-semibold' : 'text-page font-medium'}>
        {value}
      </span>
    </div>
  );
}

export default function FilmSpecs({
  film,
  audioLanguages,
  subtitles,
  tags,
  creators = [],
  onSeek,
}: FilmSpecsProps) {
  const t = useTranslations('Film');
  const releaseYear = film.release_date ? new Date(film.release_date).getFullYear() : '2026';
  const displayRuntime = film.runtime
    ? t('runtimeMin', { n: Math.ceil(film.runtime / 60) })
    : t('runtimeMin', { n: 1 });
  const displayRating = film.rating?.name ? t('ages', { n: film.rating.name }) : t('agesFallback');
  const [transcripts, setTranscripts] = useState<TranscriptRow[]>([]);

  useEffect(() => {
    if (!film?.id || subtitles.length === 0) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from('transcript')
      .select('content, language_code')
      .eq('film_id', film.id)
      .then(({ data }: { data: TranscriptRow[] | null }) => {
        if (!cancelled && data) setTranscripts(data);
      });
    return () => {
      cancelled = true;
    };
  }, [film?.id, subtitles.length]);

  const hasTranscript = subtitles.length > 0;
  const hasSecondary =
    audioLanguages.length > 0 || subtitles.length > 0 || tags.length > 0;

  const placeLine = [film.story_date, film.location].filter(Boolean).join(' · ');

  return (
    <div className="w-full max-w-3xl px-8 md:px-12 mx-auto text-left text-page font-sans select-none relative z-20">
      {/* Story leads — no About heading */}
      <div className="pb-8 border-b border-[color-mix(in_srgb,var(--page-fg)_6%,transparent)]">
        <p className="text-base md:text-[17px] leading-relaxed text-page font-medium opacity-90 max-w-3xl">
          {film.description}
        </p>

        {(placeLine || film.note) && (
          <p className="mt-3 text-sm font-medium text-page-faint">
            {placeLine}
            {placeLine && film.note ? ' · ' : null}
            {film.note ? <span className="font-normal">{film.note}</span> : null}
          </p>
        )}

        {hasTranscript && (
          <div className="mt-5">
            <FilmTranscript
              subtitles={subtitles}
              transcripts={transcripts}
              filmSlug={film.slug}
              onSeek={onSeek}
            />
          </div>
        )}
      </div>

      {/* Specs — self-explanatory grid, no section title */}
      <div className="pt-8 max-w-2xl">
        <div className="flex flex-col gap-2">
          {creators.map((item, idx) => (
            <SpecRow
              key={idx}
              label={item.role}
              value={item.creator?.name || t('unknownCreator')}
              emphasize
            />
          ))}

          <SpecRow label={t('runtimeLabel')} value={displayRuntime} />
          <SpecRow label={t('ratingLabel')} value={displayRating} />
          <SpecRow label={t('releasedLabel')} value={releaseYear} />
        </div>
      </div>

      {/* Languages & themes — whisper heading */}
      {hasSecondary && (
        <div className="mt-8 pt-8 border-t border-[color-mix(in_srgb,var(--page-fg)_6%,transparent)] max-w-2xl">
          <h3 className="text-[13px] font-medium text-page-faint mb-3 tracking-tight">
            {t('languagesAndThemes')}
          </h3>

          <div className="flex flex-col gap-2 text-[13px] text-page-muted font-medium">
            {audioLanguages.length > 0 && (
              <p>
                <span className="text-page-faint">{t('audioLabel')}</span>
                {' · '}
                {audioLanguages.join(', ')}
              </p>
            )}
            {subtitles.length > 0 && (
              <p>
                <span className="text-page-faint">{t('subtitlesLabel')}</span>
                {' · '}
                {subtitles.map((s) => s.name).join(', ')}
              </p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-page-chip rounded-[4px] px-2 py-0.5 text-[11px] text-page-muted font-medium"
                  >
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
