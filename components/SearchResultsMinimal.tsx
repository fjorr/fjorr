'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createBrowserClient } from '@supabase/ssr';
import type { SearchItem } from '@/components/SearchExperience';

const CinemaTheater = dynamic(() => import('@/components/CinemaTheater'), {
  ssr: false,
});

function formatRuntime(runtime: number | null | undefined) {
  if (!runtime) return null;
  return `${Math.ceil(runtime / 60)}M`;
}

function isComingSoon(releaseDate?: string | null) {
  if (!releaseDate) return false;
  return new Date(releaseDate).getTime() > Date.now();
}

function MetaLine({ item }: { item: SearchItem }) {
  const comingSoon = isComingSoon(item.release_date);

  if (item.item_type === 'film' && comingSoon) {
    return (
      <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-white/30">
        Coming Soon
      </p>
    );
  }

  const year = item.release_date
    ? String(new Date(item.release_date).getFullYear())
    : null;

  const parts =
    item.item_type === 'film'
      ? [item.rating, item.theme, year, formatRuntime(item.runtime)].filter(Boolean)
      : [item.label, item.creator, year].filter(Boolean);

  if (parts.length === 0) {
    return (
      <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-white/30">
        {item.item_type === 'film' ? 'Film' : 'Artifact'}
      </p>
    );
  }

  return (
    <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-white/30">
      {parts.join(' - ')}
    </p>
  );
}

export default function SearchResultsMinimal({ results }: { results: SearchItem[] }) {
  const [showTheater, setShowTheater] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<any>(null);

  const handlePlay = async (item: SearchItem) => {
    if (item.item_type !== 'film' || isComingSoon(item.release_date)) return;

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        setSelectedFilm({ slug: item.slug, name: item.name });
        setShowTheater(true);
        return;
      }

      const supabase = createBrowserClient(url, key);
      const { data: verifiedFilm } = await supabase
        .from('film')
        .select('id, name, slug, mux_playback_id, last_line, story_date, location, runtime, has_subtitles')
        .eq('slug', item.slug)
        .maybeSingle();

      if (!verifiedFilm) {
        setSelectedFilm({ slug: item.slug, name: item.name });
        setShowTheater(true);
        return;
      }

      let flattenedTracks: { code: string; name: string; vtt_url: string }[] = [];

      if (verifiedFilm.has_subtitles !== false) {
        const { data: junctionTracks } = await supabase
          .from('language_subtitle')
          .select(`
            vtt_url,
            language (
              code,
              name
            )
          `)
          .eq('film_id', verifiedFilm.id);

        flattenedTracks = (junctionTracks || []).map((track: any) => ({
          code: track.language?.code || 'en',
          name: track.language?.name || 'English',
          vtt_url: track.vtt_url || '',
        }));
      }

      setSelectedFilm({
        ...verifiedFilm,
        language_subtitle: flattenedTracks,
      });
      setShowTheater(true);
    } catch {
      setSelectedFilm({ slug: item.slug, name: item.name });
      setShowTheater(true);
    }
  };

  return (
    <div className="w-full max-w-[600px] mx-auto flex flex-col divide-y divide-white/[0.06]">
      {results.map((item) => {
        const isFilm = item.item_type === 'film';
        const comingSoon = isFilm && isComingSoon(item.release_date);
        const infoHref = isFilm ? `/film/${item.slug}` : `/artifact/${item.slug}`;
        const canPlay = isFilm && !comingSoon;

        return (
          <div
            key={item.id}
            className="w-full flex items-center justify-between gap-8 py-4 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1 max-w-[380px] flex flex-col gap-1 pr-2">
              <h2 className="font-sans text-[18px] font-bold tracking-tight text-white leading-tight">
                {item.name}
              </h2>
              {item.teaser && (
                <p className="font-sans text-[14px] font-normal text-white/70 leading-snug line-clamp-2">
                  {item.teaser}
                </p>
              )}
              <MetaLine item={item} />
            </div>

            <div className="shrink-0 w-[132px] flex items-center justify-end gap-2">
              {canPlay && (
                <button
                  type="button"
                  onClick={() => handlePlay(item)}
                  className="h-8 px-3 rounded-[6px] bg-white/15 font-sans text-[13px] font-semibold text-white hover:bg-white/25 transition-colors"
                >
                  Play
                </button>
              )}
              <Link
                href={infoHref}
                className="h-8 px-3 rounded-[6px] bg-white/5 font-sans text-[13px] font-semibold text-white/55 hover:text-white/80 hover:bg-white/10 transition-colors inline-flex items-center"
              >
                Info
              </Link>
            </div>
          </div>
        );
      })}

      {showTheater && selectedFilm && (
        <CinemaTheater
          film={selectedFilm}
          onClose={() => {
            setShowTheater(false);
            setSelectedFilm(null);
          }}
        />
      )}
    </div>
  );
}
