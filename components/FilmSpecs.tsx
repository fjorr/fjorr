'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

const FilmTranscript = dynamic(() => import('./FilmTranscript'), {
  ssr: false,
  loading: () => (
    <div className="mt-2 h-10 w-40 rounded bg-page-chip animate-pulse" aria-hidden />
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
      .then(({ data }) => {
        if (!cancelled && data) setTranscripts(data);
      });
    return () => {
      cancelled = true;
    };
  }, [film?.id, subtitles.length]);

  return (
    <div className="max-w-2xl w-full px-8 md:px-12 mx-auto text-left text-page font-sans select-none relative z-20">
      
      {/* 📖 ABOUT FILM PANEL */}
      <div className="max-w-3xl mb-8">
        <h3 className="text-lg font-bold text-page mb-3">{t('about')}</h3>
        <p className="text-base leading-normal text-page font-medium mb-4 opacity-80">
          {film.description}
        </p>
        
        {/* VERTICAL METADATA STACK */}
        <div className="flex flex-col items-start gap-0.5 text-sm font-medium text-page-faint">
          {film.story_date && <span>{film.story_date}</span>}
          {film.location && <span>{film.location}</span>}
          {film.note && <span className="font-normal">{film.note}</span>}
        </div>

        {subtitles.length > 0 && (
          <div className="mt-6">
            <FilmTranscript
              subtitles={subtitles}
              transcripts={transcripts}
              filmSlug={film.slug}
              onSeek={onSeek}
            />
          </div>
        )}
      </div>

      {/* 📋 UNIFIED DETAILS PANEL */}
      <div className="w-full mt-14">
        <h3 className="text-lg font-bold text-page mb-6 tracking-tight">{t('specs')}</h3>
        
        {/* A single, vertically continuous stack with tight, deliberate rhythm */}
        <div className="flex flex-col space-y-2 text-sm">
          
          {/* Dynamic Filmmaker Data Blocks */}
          {creators.map((item, idx) => (
            <div key={idx} className="flex items-baseline gap-2">
              <span className="text-page-faint font-medium capitalize">{item.role}</span>
              <span className="text-page font-semibold">{item.creator?.name || t('unknownCreator')}</span>
            </div>
          ))}

          {/* Technical Specifications Rows */}
          <div className="flex items-baseline gap-2">
            <span className="text-page-faint font-medium">{t('runtimeLabel')}</span>
            <span className="text-page font-semibold">{displayRuntime}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-page-faint font-medium">{t('ratingLabel')}</span>
            <span className="text-page font-semibold">{displayRating}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-page-faint font-medium">{t('releasedLabel')}</span>
            <span className="text-page font-semibold">{releaseYear}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-page-faint font-medium">{t('audioLabel')}</span>
            <span className="text-page font-semibold">{audioLanguages.join(', ')}</span>
          </div>

          {subtitles.length > 0 && (
            <div className="flex items-baseline gap-2">
              <span className="text-page-faint font-medium">{t('subtitlesLabel')}</span>
              <span className="text-page font-semibold">
                {subtitles.map(s => s.name).join(', ')}
              </span>
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-page-faint font-medium shrink-0 pt-0.5">{t('tagsLabel')}</span>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-page-chip rounded-[4px] px-2 py-0.5 text-[12px] text-page font-semibold"
                  >
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
