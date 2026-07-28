'use client';

import React, { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import FeatureRail from './FeatureRail';
import TheaterOpenShell from '@/components/TheaterOpenShell';
import { useDisplayMode } from '@/components/DisplayModeProvider';
import { useMinimalFilterOptional } from '@/components/MinimalFilterContext';
import {
  clearWatchProgress,
  trackWatchProgress,
} from '@/lib/watch-progress';
import { openTheaterFromFilm } from '@/lib/theater-open';

const CinemaTheater = dynamic(() => import('@/components/CinemaTheater'), {
  ssr: false,
  loading: () => <TheaterOpenShell />,
});

export default function FeatureRailClient({ films }: { films: any[] }) {
  const { mode } = useDisplayMode();
  const searchActive = useMinimalFilterOptional()?.searchActive ?? false;
  const [activeIndex, setActiveIndex] = useState(0);
  const [showTheater, setShowTheater] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<any>(null);
  const [startAt, setStartAt] = useState<number | undefined>(undefined);
  const isBrowseActive = mode === 'cinematic' && !searchActive;

  const handlePlayClick = (filmAsset: any) => {
    openTheaterFromFilm({
      film: {
        id: filmAsset.id,
        name: filmAsset.name,
        slug: filmAsset.slug,
        mux_playback_id: filmAsset.mux_playback_id,
        last_line: filmAsset.last_line,
        story_date: filmAsset.story_date,
        location: filmAsset.location,
        runtime: filmAsset.runtime,
        has_subtitles: filmAsset.has_subtitles,
        sponsor:
          typeof filmAsset.sponsor === 'object'
            ? filmAsset.sponsor?.name
            : filmAsset.sponsor,
      },
      setSelectedFilm,
      setStartAt,
      setShowTheater,
    });
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
    <div className="w-full relative bg-[var(--page-bg)]">
      <FeatureRail
        films={films}
        activeIndex={activeIndex}
        onSlideChange={setActiveIndex}
        onPlayClick={handlePlayClick}
        isTheaterActive={showTheater}
        isBrowseActive={isBrowseActive}
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
