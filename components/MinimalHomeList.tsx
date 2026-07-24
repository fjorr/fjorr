'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createBrowserClient } from '@supabase/ssr';
import { useTranslations } from 'next-intl';
import { useMinimalFilter } from '@/components/MinimalFilterContext';
import SearchNadaView from '@/components/SearchNadaView';

const CinemaTheater = dynamic(() => import('@/components/CinemaTheater'), {
  ssr: false,
});

export type MinimalFilm = {
  id: string;
  name: string;
  slug: string;
  teaser: string | null;
  runtime: number | null;
  release_date: string | null;
  story_date: string | null;
  mux_playback_id: string | null;
  rating?: string | null;
  theme?: string | null;
};

function formatRuntime(runtime: number | null | undefined) {
  if (!runtime) return null;
  return `${Math.ceil(runtime / 60)}M`;
}

function formatYear(film: MinimalFilm) {
  if (film.story_date) return String(film.story_date);
  if (film.release_date) return String(new Date(film.release_date).getFullYear());
  return null;
}

function isComingSoon(film: MinimalFilm) {
  if (!film.release_date) return false;
  return new Date(film.release_date).getTime() > Date.now();
}

function releaseTime(film: MinimalFilm) {
  if (!film.release_date) return 0;
  return new Date(film.release_date).getTime();
}

function MetaLine({ film }: { film: MinimalFilm }) {
  const t = useTranslations('Film');
  const year = formatYear(film);
  if (isComingSoon(film)) {
    return (
      <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-white/30">
        {t('comingSoon')}
        {year ? ` · ${year}` : ''}
      </p>
    );
  }

  const parts = [film.rating, film.theme, formatYear(film), formatRuntime(film.runtime)].filter(
    Boolean
  );

  if (parts.length === 0) return null;

  return (
    <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-white/30">
      {parts.join(' - ')}
    </p>
  );
}

export default function MinimalHomeList({ films }: { films: MinimalFilm[] }) {
  const t = useTranslations('Film');
  const { sort, theme, mix, mixes, setThemes } = useMinimalFilter();
  const [showTheater, setShowTheater] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<any>(null);

  useEffect(() => {
    const set = new Set<string>();
    for (const film of films) {
      if (film.theme) set.add(film.theme);
    }
    setThemes(Array.from(set).sort((a, b) => a.localeCompare(b)));
  }, [films, setThemes]);

  const visibleFilms = useMemo(() => {
    let next = [...films];

    if (mix === 'coming-soon') {
      next = next.filter((f) => isComingSoon(f));
    } else if (mix !== 'all') {
      const selected = mixes.find((m) => m.slug === mix);
      if (selected) {
        const idSet = new Set(selected.filmIds);
        next = next.filter((f) => idSet.has(f.id));
      }
    }

    if (theme !== 'all') next = next.filter((f) => f.theme === theme);

    next.sort((a, b) => {
      if (sort === 'az') return a.name.localeCompare(b.name);
      if (sort === 'runtime') return (b.runtime || 0) - (a.runtime || 0);
      const aSoon = isComingSoon(a);
      const bSoon = isComingSoon(b);
      if (aSoon !== bSoon) return aSoon ? 1 : -1;
      if (aSoon && bSoon) return releaseTime(a) - releaseTime(b);
      return releaseTime(b) - releaseTime(a);
    });

    return next;
  }, [films, mix, mixes, sort, theme]);

  const handlePlay = async (film: MinimalFilm) => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        setSelectedFilm(film);
        setShowTheater(true);
        return;
      }

      const supabase = createBrowserClient(url, key);
      const { data: verifiedFilm } = await supabase
        .from('film')
        .select(
          'id, name, slug, mux_playback_id, last_line, story_date, location, runtime, has_subtitles'
        )
        .eq('slug', film.slug)
        .maybeSingle();

      if (!verifiedFilm) {
        setSelectedFilm(film);
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
      setSelectedFilm(film);
      setShowTheater(true);
    }
  };

  return (
    <div className="w-full pb-8">
      <div className="w-full max-w-[600px] mx-auto px-5 pt-2 flex flex-col divide-y divide-white/[0.06]">
        {visibleFilms.length === 0 ? (
          <div className="flex w-full justify-center py-6">
            <SearchNadaView />
          </div>
        ) : (
          visibleFilms.map((film) => {
            const comingSoon = isComingSoon(film);

            return (
              <div
                key={film.id}
                className="w-full flex items-center justify-between gap-8 py-4 first:pt-0 last:pb-0"
              >
                <Link
                  href={`/film/${film.slug}`}
                  className="min-w-0 flex-1 max-w-[380px] flex flex-col gap-1 pr-2 group"
                >
                  <h2 className="font-sans text-[18px] font-bold tracking-tight text-white leading-tight group-hover:text-white/85 transition-colors">
                    {film.name}
                  </h2>
                  {film.teaser && (
                    <p className="font-sans text-[14px] font-normal text-white/70 leading-snug line-clamp-2">
                      {film.teaser}
                    </p>
                  )}
                  <MetaLine film={film} />
                </Link>

                <div className="shrink-0 w-[132px] flex items-center justify-end gap-2">
                  {!comingSoon && (
                    <button
                      type="button"
                      onClick={() => handlePlay(film)}
                      className="h-8 px-3 rounded-[6px] bg-white/15 font-sans text-[13px] font-semibold text-white hover:bg-white/25 transition-colors"
                    >
                      {t('playShort')}
                    </button>
                  )}
                  <Link
                    href={`/film/${film.slug}`}
                    className="h-8 px-3 rounded-[6px] bg-white/5 font-sans text-[13px] font-semibold text-white/55 hover:text-white/80 hover:bg-white/10 transition-colors inline-flex items-center"
                  >
                    {t('info')}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

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
