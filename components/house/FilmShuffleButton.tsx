'use client';

import React, { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

export type FilmShuffleTarget = {
  slug: string;
};

type Props = {
  currentSlug: string;
  films: FilmShuffleTarget[];
  /** Absolute on the poster (FeatureRail-style) vs footer chrome. */
  placement?: 'poster' | 'footer';
  className?: string;
  /** In-place shuffle (home rail). Defaults to navigating to `/film/[slug]`. */
  onShuffle?: (slug: string) => void;
};

function pickOther(films: FilmShuffleTarget[], currentSlug: string) {
  const others = films.filter((film) => film.slug && film.slug !== currentSlug);
  if (!others.length) return null;
  return others[Math.floor(Math.random() * others.length)] ?? null;
}

/** Crossed-arrows shuffle — jump to another film poster for lazy browsing. */
export default function FilmShuffleButton({
  currentSlug,
  films,
  placement = 'poster',
  className = '',
  onShuffle,
}: Props) {
  const t = useTranslations('Film');
  const router = useRouter();

  const shuffle = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const next = pickOther(films, currentSlug);
      if (!next?.slug) return;
      if (onShuffle) {
        onShuffle(next.slug);
        return;
      }
      router.push(`/film/${next.slug}`);
    },
    [currentSlug, films, onShuffle, router]
  );

  if (films.filter((film) => film.slug && film.slug !== currentSlug).length === 0) {
    return null;
  }

  const shell =
    placement === 'poster'
      ? 'absolute bottom-4 right-4 z-30 md:bottom-5 md:right-5'
      : 'relative';

  return (
    <button
      type="button"
      onClick={shuffle}
      aria-label={t('shuffle')}
      title={t('shuffle')}
      className={`${shell} flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 active:scale-95 ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
        <path
          d="m18 14 4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m18 2 4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 18h1.973a4 4 0 0 0 3.3-1.7l9.454-12.6A4 4 0 0 1 19.973 2H22"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 6h1.972a4 4 0 0 1 3.3 1.7l9.458 12.6a4 4 0 0 0 3.3 1.7H22"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
