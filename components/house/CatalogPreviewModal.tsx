'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import HouseHeroPreview from '@/components/house/HouseHeroPreview';

export type CatalogPreviewFilm = {
  slug: string;
  name: string;
  teaser: string | null;
  year: string | null;
  runtime: number | null;
  comingSoon: boolean;
  poster: string | null;
  playbackId: string | null;
};

function runtimeLabel(seconds?: number | null) {
  if (!seconds) return null;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 0 ? '1m' : `${minutes}m`;
}

/**
 * Catalog preview modal — poster + muted 8s Mux tease + overview.
 * Full-viewport Apple-style frost; Esc / backdrop closes without leaving search.
 */
export default function CatalogPreviewModal({
  film,
  onClose,
  onPlay,
}: {
  film: CatalogPreviewFilm;
  onClose: () => void;
  onPlay: () => void;
}) {
  const t = useTranslations('Film');
  const [mounted, setMounted] = useState(false);
  const duration = film.comingSoon ? null : runtimeLabel(film.runtime);
  const meta = [film.year, duration].filter(Boolean).join(' · ');
  const teaser = film.teaser?.trim() || '';
  const canTease = Boolean(film.playbackId) && !film.comingSoon;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-8 lg:p-10"
      role="presentation"
    >
      <button
        type="button"
        aria-label={t('sendClose')}
        onClick={onClose}
        className="absolute inset-0 border-0 bg-black/40 backdrop-blur-[6px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={film.name}
        className="relative z-[1] w-full max-w-[24rem] overflow-hidden rounded-[18px] bg-white text-[#0B0B0C] shadow-[0_28px_80px_rgba(0,0,0,0.35)] sm:max-w-[32rem] sm:rounded-[20px] lg:max-w-[38rem] xl:max-w-[42rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-black sm:aspect-[16/9]">
          <HouseHeroPreview
            poster={film.poster}
            playbackId={canTease ? film.playbackId : null}
            runtime={film.runtime}
            active
          />
        </div>

        <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 lg:px-7 lg:pb-7">
          <h2 className="m-0 font-interTight text-[20px] font-bold leading-tight tracking-tight sm:text-[22px] lg:text-[24px]">
            {film.name}
          </h2>
          {meta ? (
            <p className="mt-1 font-sans text-[12px] font-medium text-black/40 sm:text-[13px]">
              {meta}
            </p>
          ) : null}
          {teaser ? (
            <p className="mt-2.5 max-w-[40rem] font-sans text-[14px] leading-snug text-black/60 sm:mt-3 sm:text-[15px]">
              {teaser}
            </p>
          ) : null}

          <div className="mt-4 flex items-baseline gap-4 sm:mt-5">
            {film.comingSoon ? (
              <span className="font-sans text-[13px] font-semibold text-black/35">
                {t('comingSoonOnFjorr')}
              </span>
            ) : (
              <button
                type="button"
                onClick={onPlay}
                className="border-0 bg-transparent p-0 font-sans text-[14px] font-semibold tracking-tight text-[#0B0B0C] transition-opacity hover:opacity-70 sm:text-[15px]"
              >
                {duration ? t('play', { runtime: duration }) : t('playShort')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="border-0 bg-transparent p-0 font-sans text-[13px] font-semibold tracking-tight text-black/35 transition-colors hover:text-[#0B0B0C]"
            >
              {t('sendClose')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
