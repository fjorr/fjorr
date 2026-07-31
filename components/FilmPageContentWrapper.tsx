'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import FilmHero from './FilmHero';
import ArtifactRail from './ArtifactRail';
import FilmRail from './FilmRail';
import FilmSpecs from './FilmSpecs';
import { useWatchProgress } from '@/components/useWatchProgress';
import TheaterOpenShell from '@/components/TheaterOpenShell';
import {
  finishWatchProgress,
  getWatchProgress,
  isWatchableProgress,
  trackWatchProgress,
} from '@/lib/watch-progress';
import { parseViaMemberNumber, writeViaCookie } from '@/lib/voyage-via';
const CinemaTheater = dynamic(() => import('@/components/CinemaTheater'), {
  ssr: false,
  loading: () => <TheaterOpenShell />,
});

const FilmTranscriptLazy = dynamic(() => import('@/components/FilmTranscriptLazy'), {
  ssr: false,
});

interface WrapperProps {
  filmData: any;
  relatedArtifacts: any[];
  recommendedFilms: any[];
  subtitlesData: any[];
  tags: string[];
  creatorRows: any[];
  displayLocation: string;
  isComingSoon: boolean;
}

export default function FilmPageContentWrapper({
  filmData,
  relatedArtifacts,
  recommendedFilms,
  subtitlesData,
  tags,
  creatorRows,
  displayLocation,
  isComingSoon,
}: WrapperProps) {
  const t = useTranslations('Film');
  const [showTheater, setShowTheater] = useState(false);
  const [startAt, setStartAt] = useState<number | undefined>(undefined);
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [shareSeconds, setShareSeconds] = useState<number | null>(null);
  const [openInPlus, setOpenInPlus] = useState(false);
  const theaterOpenRef = React.useRef(false);
  const lastShareFloorRef = useRef<number | null>(null);
  const resumeProgress = useWatchProgress(filmData?.id, filmData?.runtime);

  useEffect(() => {
    theaterOpenRef.current = showTheater;
  }, [showTheater]);

  // Deep link: /film/slug?t=84 opens the theater at that second.
  // Lineage: /film/slug?via={memberNumber} remembers who passed the film.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const via = parseViaMemberNumber(params.get('via'));
    if (via != null && filmData?.id) {
      writeViaCookie(String(filmData.id), via);
    }

    if (isComingSoon) return;
    const raw = params.get('t');
    if (!raw) return;
    const seconds = Number(raw);
    if (!Number.isFinite(seconds) || seconds < 0) return;
    setStartAt(seconds);
    setShareSeconds(seconds);
    setShowTheater(true);
  }, [isComingSoon, filmData?.id]);

  const openFromTime = useCallback((seconds: number) => {
    setPlaybackTime(seconds);
    setShareSeconds(seconds);
    if (theaterOpenRef.current) {
      setSeekTo(seconds);
      return;
    }
    setStartAt(seconds);
    setSeekTo(null);
    setShowTheater(true);
  }, []);

  const handleSeekHandled = useCallback(() => setSeekTo(null), []);

  const handleCloseTheater = useCallback(() => {
    if (filmData?.id) {
      trackWatchProgress({
        filmId: filmData.id,
        slug: filmData.slug,
        seconds: playbackTime,
        duration: filmData.runtime,
      });
    }
    setShowTheater(false);
    setStartAt(undefined);
    setSeekTo(null);
    setPlaybackTime(0);
    setOpenInPlus(false);
    lastShareFloorRef.current = null;
    const url = new URL(window.location.href);
    if (url.searchParams.has('t')) {
      url.searchParams.delete('t');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [filmData?.id, filmData?.runtime, filmData?.slug, playbackTime]);

  const handlePlayClick = useCallback(() => {
    const saved = getWatchProgress(filmData.id);
    const resumeAt = isWatchableProgress(saved, filmData.runtime)
      ? saved.seconds
      : undefined;
    setOpenInPlus(false);
    setStartAt(resumeAt);
    setSeekTo(null);
    setShowTheater(true);
  }, [filmData.id, filmData.runtime]);

  const handleOpenPlus = useCallback(() => {
    const saved = getWatchProgress(filmData.id);
    const resumeAt = isWatchableProgress(saved, filmData.runtime)
      ? saved.seconds
      : undefined;
    setOpenInPlus(true);
    setStartAt(resumeAt);
    setSeekTo(null);
    setShowTheater(true);
  }, [filmData.id, filmData.runtime]);

  const handleTimeUpdate = useCallback(
    (seconds: number) => {
      setPlaybackTime(seconds);
      // Throttle share-link updates to once per whole second so the dependent
      // FilmHero share button doesn't re-render on every parent time tick.
      if (seconds >= 1) {
        const floorSeconds = Math.floor(seconds);
        if (lastShareFloorRef.current === null || floorSeconds !== lastShareFloorRef.current) {
          lastShareFloorRef.current = floorSeconds;
          setShareSeconds(seconds);
        }
      }
      if (!filmData?.id || !filmData?.slug) return;
      trackWatchProgress({
        filmId: filmData.id,
        slug: filmData.slug,
        seconds,
        duration: filmData.runtime,
      });
    },
    [filmData.id, filmData.runtime, filmData.slug]
  );

  const handleEnded = useCallback(() => {
    if (filmData?.id) finishWatchProgress(filmData.id);
  }, [filmData?.id]);

  const theaterFilm = useMemo(
    () => ({
      id: filmData.id,
      name: filmData.name,
      slug: filmData.slug,
      mux_playback_id: filmData.mux_playback_id,
      last_line: filmData.last_line,
      story_date: filmData.story_date || filmData.story_year || '1972',
      location: displayLocation,
      teaser: filmData.teaser,
      runtime: filmData.runtime,
      blok_tall: filmData.blok_tall,
      hero_tall: filmData.hero_tall,
      language_subtitle: subtitlesData,
    }),
    [filmData, displayLocation, subtitlesData]
  );

  return (
    <div className="w-full relative bg-[var(--page-bg)]">
      {showTheater && (
        <>
          <CinemaTheater
            onClose={handleCloseTheater}
            startAt={startAt}
            seekTo={seekTo}
            onSeekHandled={handleSeekHandled}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            film={theaterFilm}
            initialTheaterMode={openInPlus ? 'plus' : 'watch'}
          />

          {subtitlesData.length > 0 && (
            <aside className="fixed top-0 right-0 z-[85] hidden lg:flex w-[min(360px,34vw)] h-[100svh] flex-col border-l border-white/10 bg-[#1a1a1a]/95 backdrop-blur-xl pt-16 pb-6 px-4">
              <FilmTranscriptLazy
                variant="dock"
                subtitles={subtitlesData}
                transcripts={[]}
                filmSlug={filmData.slug}
                activeTime={playbackTime}
                onSeek={(seconds) => {
                  setSeekTo(seconds);
                  setPlaybackTime(seconds);
                  setShareSeconds(seconds);
                }}
              />
            </aside>
          )}
        </>
      )}

      <div className="w-full">
        <FilmHero
          film={filmData}
          onPlayClick={handlePlayClick}
          shareSeconds={shareSeconds}
          resumeSeconds={resumeProgress?.seconds ?? null}
        />

        <div className="w-full bg-[var(--page-bg)] pt-0 pb-24 flex flex-col gap-0">
          {relatedArtifacts.length > 0 && (
            <div className="w-full min-w-0 mt-8 md:mt-12">
              <ArtifactRail
                title={t('relatedArtifacts')}
                artifacts={relatedArtifacts}
                quietTitle
              />
            </div>
          )}

          {!isComingSoon && (
            <div className="w-full mt-8 md:mt-12">
              <FilmSpecs
                film={{ ...filmData, location: displayLocation }}
                audioLanguages={['English']}
                subtitles={subtitlesData}
                tags={tags}
                creators={creatorRows}
                onSeek={openFromTime}
                onOpenPlus={handleOpenPlus}
              />
            </div>
          )}

          {recommendedFilms.length > 0 && (
            <div className="w-full min-w-0 mt-8 md:mt-12">
              <FilmRail title={t('moreFilms')} films={recommendedFilms} size="compact" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
