'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CinemaTheater from '@/components/CinemaTheater';
import { absoluteUrl } from '@/lib/site';

type EmbedFilmPlayerProps = {
  film: {
    id: string;
    name: string;
    slug: string;
    teaser?: string | null;
    mux_playback_id?: string | null;
    last_line?: string | null;
    story_date?: string | null;
    location?: string | null;
    blok_tall?: string | null;
    hero_wide?: string | null;
    hero_clsx?: string | null;
    release_date?: string | null;
    language_subtitle?: {
      code: string;
      name: string;
      vtt_url: string;
    }[];
  };
  startAt?: number;
};

export default function EmbedFilmPlayer({ film, startAt = 0 }: EmbedFilmPlayerProps) {
  const poster = film.hero_clsx || film.hero_wide || film.blok_tall || null;
  const isComingSoon = film.release_date
    ? new Date(film.release_date).getTime() > Date.now()
    : false;
  const watchUrl = `${absoluteUrl(`/film/${film.slug}`)}?utm_source=embed&utm_medium=iframe&utm_campaign=${encodeURIComponent(film.slug)}`;

  if (isComingSoon || !film.mux_playback_id) {
    return (
      <div className="relative w-full h-full min-h-[200px] bg-black text-white font-sans overflow-hidden">
        {poster && (
          <Image src={poster} alt={film.name} fill sizes="100vw" className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-[16px] leading-tight truncate">{film.name}</p>
            <p className="text-[12px] text-white/70 mt-1">Coming soon on Fjorr</p>
          </div>
          <Link
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 h-9 px-3 rounded-full bg-white/15 hover:bg-white/25 text-[12px] font-semibold inline-flex items-center"
          >
            Watch on Fjorr
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[200px] bg-black overflow-hidden">
      <CinemaTheater
        mode="embed"
        startAt={startAt > 0 ? startAt : undefined}
        onClose={() => {
          window.open(watchUrl, '_blank', 'noopener,noreferrer');
        }}
        film={{
          id: film.id,
          name: film.name,
          slug: film.slug,
          mux_playback_id: film.mux_playback_id,
          last_line: film.last_line,
          story_date: film.story_date || '',
          location: film.location || '',
          language_subtitle: film.language_subtitle,
        }}
      />
    </div>
  );
}
