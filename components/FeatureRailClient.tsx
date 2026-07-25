'use client';

import React, { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import FeatureRail from './FeatureRail';
import { createBrowserClient } from '@supabase/ssr';
import {
  clearWatchProgress,
  getWatchProgress,
  isWatchableProgress,
  trackWatchProgress,
} from '@/lib/watch-progress';

const CinemaTheater = dynamic(() => import('@/components/CinemaTheater'), {
  ssr: false,
});

export default function FeatureRailClient({ films }: { films: any[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showTheater, setShowTheater] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<any>(null);
  const [startAt, setStartAt] = useState<number | undefined>(undefined);

  const handlePlayClick = async (filmAsset: any) => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        const saved = getWatchProgress(filmAsset.id);
        setStartAt(
          isWatchableProgress(saved, filmAsset.runtime) ? saved.seconds : undefined
        );
        setSelectedFilm(filmAsset);
        setShowTheater(true);
        return;
      }

      const supabase = createBrowserClient(url, key);

      const { data: verifiedFilm, error: filmError } = await supabase
        .from('film')
        .select(
          'id, name, slug, mux_playback_id, last_line, story_date, location, runtime, has_subtitles'
        )
        .eq('slug', filmAsset.slug)
        .maybeSingle();

      if (filmError || !verifiedFilm) {
        const saved = getWatchProgress(filmAsset.id);
        setStartAt(
          isWatchableProgress(saved, filmAsset.runtime) ? saved.seconds : undefined
        );
        setSelectedFilm(filmAsset);
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

      const saved = getWatchProgress(verifiedFilm.id);
      setStartAt(
        isWatchableProgress(saved, verifiedFilm.runtime) ? saved.seconds : undefined
      );
      setSelectedFilm({
        ...verifiedFilm,
        language_subtitle: flattenedTracks,
        sponsor: filmAsset.sponsor,
      });
      setShowTheater(true);
    } catch (e) {
      console.error(e);
      const saved = getWatchProgress(filmAsset.id);
      setStartAt(
        isWatchableProgress(saved, filmAsset.runtime) ? saved.seconds : undefined
      );
      setSelectedFilm(filmAsset);
      setShowTheater(true);
    }
  };

  const handleTimeUpdate = useCallback(
    (seconds: number) => {
      if (!selectedFilm?.id || !selectedFilm?.slug) return;
      trackWatchProgress({
        filmId: selectedFilm.id,
        slug: selectedFilm.slug,
        seconds,
        duration: selectedFilm.runtime,
      });
    },
    [selectedFilm]
  );

  const handleEnded = useCallback(() => {
    if (selectedFilm?.id) clearWatchProgress(selectedFilm.id);
  }, [selectedFilm?.id]);

  if (!films?.length) return null;

  return (
    <div className="w-full relative bg-[#1F1F1F]">
      <FeatureRail
        films={films}
        activeIndex={activeIndex}
        onSlideChange={setActiveIndex}
        onPlayClick={handlePlayClick}
        isTheaterActive={showTheater}
      />

      {showTheater && selectedFilm && (
        <CinemaTheater
          film={selectedFilm}
          startAt={startAt}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onClose={() => {
            setShowTheater(false);
            setSelectedFilm(null);
            setStartAt(undefined);
          }}
        />
      )}
    </div>
  );
}
