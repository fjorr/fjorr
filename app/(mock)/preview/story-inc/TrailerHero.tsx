'use client';

import { useState } from 'react';

/** Poster + play — YouTube embed, or external trailer URL (Frame.io, etc.). */
export default function TrailerHero({
  className = '',
  rounded = 'rounded-[28px]',
  poster = '/preview/story-inc/trailer-poster.png',
  title = 'Angry Birds 3',
  teaserLabel = 'Official teaser',
  youtubeId,
  trailerUrl,
}: {
  className?: string;
  rounded?: string;
  poster?: string;
  title?: string;
  teaserLabel?: string;
  /** When set, play loads this YouTube embed in the hero. */
  youtubeId?: string;
  /** External trailer (e.g. Frame.io) — opens in a new tab on play. */
  trailerUrl?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const playable = Boolean(youtubeId || trailerUrl);
  const posterSrc =
    poster ||
    (youtubeId
      ? `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`
      : '/preview/story-inc/trailer-poster.png');

  if (playing && youtubeId) {
    return (
      <div
        className={`relative aspect-video overflow-hidden bg-black ${rounded} ${className}`}
      >
        <iframe
          title={`${title} trailer`}
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (youtubeId) {
          setPlaying(true);
          return;
        }
        if (trailerUrl) {
          window.open(trailerUrl, '_blank', 'noopener,noreferrer');
        }
      }}
      aria-label={`Play ${title} trailer`}
      className={`group relative block w-full overflow-hidden bg-black text-left ${rounded} ${className} ${
        playable ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <img
        src={posterSrc}
        alt={`${title} trailer`}
        className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
      <span className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/25" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-[#1d1d1f] transition-transform group-hover:scale-105 sm:h-[4.5rem] sm:w-[4.5rem]">
          <svg
            viewBox="0 0 24 24"
            className="ml-1 h-7 w-7 fill-current sm:h-8 sm:w-8"
            aria-hidden
          >
            <path d="M8 5.14v13.72L19 12 8 5.14z" />
          </svg>
        </span>
      </span>
      <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-4 pt-12">
        <span className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-white/70">
          {teaserLabel}
        </span>
        <span className="mt-0.5 block text-[15px] font-bold text-white sm:text-[16px]">
          {title}
        </span>
      </span>
    </button>
  );
}
