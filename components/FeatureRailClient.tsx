'use client';

import React, { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import FeatureRail from './FeatureRail';
import TheaterOpenShell from '@/components/TheaterOpenShell';
import { useDisplayMode } from '@/components/DisplayModeProvider';
import { useMinimalFilterOptional } from '@/components/MinimalFilterContext';
import {
  finishWatchProgress,
  trackWatchProgress,
} from '@/lib/watch-progress';
import { openTheaterFromFilm } from '@/lib/theater-open';

const CinemaTheater = dynamic(() => import('@/components/CinemaTheater'), {
  ssr: false,
  loading: () => <TheaterOpenShell />,
});

export default function FeatureRailClient({ films }: { films: any[] }) {
  const t = useTranslations('Home');
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
    if (selectedFilm?.id) finishWatchProgress(selectedFilm.id);
  }, [selectedFilm?.id]);

  if (!films?.length) {
    return (
      <section className="w-full flex flex-col items-center justify-center gap-4 bg-[var(--page-bg)] px-8 py-16">
        <p className="m-0 font-sans text-[15px] text-page-muted text-center max-w-sm">
          {t('emptyFeatured')}
        </p>
        <Link
          href="/bureaux"
          className="font-sans text-[13px] font-semibold text-page underline underline-offset-2"
        >
          {t('joinCue')}
        </Link>
      </section>
    );
  }

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
