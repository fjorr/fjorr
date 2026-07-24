'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { absoluteUrl } from '@/lib/site';
import { formatCueClock } from '@/lib/vtt';

type FilmSendSheetProps = {
  open: boolean;
  onClose: () => void;
  film: {
    name?: string | null;
    slug: string;
    teaser?: string | null;
    runtime?: number | null;
    blok_tall?: string | null;
    hero_tall?: string | null;
  };
  /** Last known playback / cue time in seconds (shows timestamp copy when >= 1). */
  shareSeconds?: number | null;
};

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export default function FilmSendSheet({
  open,
  onClose,
  film,
  shareSeconds = null,
}: FilmSendSheetProps) {
  const t = useTranslations('Film');
  const panelRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const filmUrl = useMemo(() => absoluteUrl(`/film/${film.slug}`), [film.slug]);
  const embedUrl = useMemo(() => absoluteUrl(`/embed/film/${film.slug}`), [film.slug]);

  const timeSeconds =
    typeof shareSeconds === 'number' && Number.isFinite(shareSeconds) && shareSeconds >= 1
      ? Math.floor(shareSeconds)
      : null;

  const timeUrl = timeSeconds != null ? `${filmUrl}?t=${timeSeconds}` : null;
  const timeLabel = timeSeconds != null ? formatCueClock(timeSeconds) : null;

  const runtimeLabel = film.runtime
    ? `${Math.max(1, Math.ceil(film.runtime / 60))}m`
    : null;

  const poster = film.blok_tall || film.hero_tall || null;

  const embedSnippet = `<iframe src="${embedUrl}" title="${(film.name || 'Fjorr').replace(/"/g, '&quot;')} — Fjorr" width="100%" height="100%" style="aspect-ratio:16/9;width:100%;border:0;border-radius:12px;overflow:hidden" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>`;

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onPointer = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setCopied(null);
  }, [open]);

  if (!open) return null;

  const markCopied = (key: string) => {
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const handleCopy = async (key: string, text: string) => {
    try {
      await copyText(text);
      markCopied(key);
    } catch {
      // ignore
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: film.name || 'Fjorr',
        text: film.teaser || t('sendNativeText'),
        url: timeUrl || filmUrl,
      });
      onClose();
    } catch {
      // user cancelled
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" aria-hidden />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('send')}
        className="relative w-full sm:max-w-[400px] rounded-t-[16px] sm:rounded-[16px] border border-white/10 bg-[#1F1F1F] shadow-[0_24px_80px_rgba(0,0,0,0.55)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="relative w-14 h-[84px] rounded-[6px] overflow-hidden bg-white/5 shrink-0 border border-white/10">
            {poster ? (
              <Image src={poster} alt="" fill sizes="56px" className="object-cover" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-sans font-bold text-[16px] text-white leading-tight truncate">
              {film.name}
            </p>
            <p className="font-sans text-[12px] text-white/45 mt-1">
              {[runtimeLabel, 'Fjorr'].filter(Boolean).join(' · ')}
            </p>
            {film.teaser && (
              <p className="font-sans text-[13px] text-white/55 mt-2 line-clamp-2 leading-snug">
                {film.teaser}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('sendClose')}
            className="h-8 w-8 shrink-0 rounded-[8px] bg-white/5 hover:bg-white/10 text-white/50 hover:text-white inline-flex items-center justify-center"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleCopy('link', filmUrl)}
            className="w-full h-11 rounded-[10px] bg-white text-black font-sans font-bold text-sm hover:bg-white/90 transition-colors"
          >
            {copied === 'link' ? t('sendCopied') : t('sendCopyLink')}
          </button>

          {timeUrl && timeLabel && (
            <button
              type="button"
              onClick={() => handleCopy('time', timeUrl)}
              className="w-full h-11 rounded-[10px] bg-white/10 text-white font-sans font-semibold text-sm hover:bg-white/15 transition-colors"
            >
              {copied === 'time' ? t('sendCopied') : t('sendCopyAt', { time: timeLabel })}
            </button>
          )}

          <button
            type="button"
            onClick={() => handleCopy('embed', embedSnippet)}
            className="w-full h-11 rounded-[10px] bg-white/5 text-white/80 font-sans font-semibold text-sm hover:bg-white/10 hover:text-white transition-colors"
          >
            {copied === 'embed' ? t('sendCopied') : t('sendCopyEmbed')}
          </button>

          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full h-11 rounded-[10px] bg-transparent text-white/50 font-sans font-semibold text-sm hover:text-white/80 transition-colors"
            >
              {t('sendMore')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
