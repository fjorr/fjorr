'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import VoyageurBadgeMark from '@/components/VoyageurBadgeMark';
import { absoluteUrl } from '@/lib/site';
import { filmSharePath } from '@/lib/voyage-via';

type Props = {
  open: boolean;
  onClose: () => void;
  filmName: string;
  filmSlug: string;
  filmPoster?: string | null;
  viewerNumber: number;
  filmVersion?: number;
  memberNumber?: number | null;
  recordedAt?: string | null;
};

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

/** Post-stamp ritual — full Voyageur mark as something you can send. */
export default function ViewerStampShare({
  open,
  onClose,
  filmName,
  filmSlug,
  filmPoster = null,
  viewerNumber,
  filmVersion = 1,
  memberNumber,
  recordedAt = null,
}: Props) {
  const t = useTranslations('Film');
  const panelRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const filmUrl = absoluteUrl(
    filmSharePath({ slug: filmSlug, memberNumber })
  );
  const shareText = t('stampShareText', {
    number: viewerNumber,
    title: filmName,
  });
  const sharePayload = `${shareText}\n${filmUrl}`;

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== 'undefined' && typeof navigator.share === 'function'
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  if (!open) return null;

  const primaryClass =
    'w-full h-11 rounded-[10px] bg-white text-black font-sans font-bold text-sm hover:bg-white/90 transition-colors';
  const secondaryClass =
    'w-full h-11 rounded-[10px] bg-white/10 text-white font-sans font-semibold text-sm hover:bg-white/15 transition-colors';

  const handleSend = async () => {
    try {
      await navigator.share({
        title: filmName,
        text: shareText,
        url: filmUrl,
      });
      onClose();
    } catch {
      /* cancelled */
    }
  };

  const handleCopy = async () => {
    try {
      await copyText(sharePayload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-0 z-[100060] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('stampShareTitle')}
        className="relative w-full sm:max-w-[380px] rounded-t-[16px] sm:rounded-[16px] border border-white/10 bg-[#1F1F1F] shadow-[0_24px_80px_rgba(0,0,0,0.55)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <VoyageurBadgeMark
          filmName={filmName}
          filmPoster={filmPoster}
          voyageurNumber={viewerNumber}
          recordedAt={recordedAt}
          tone="onDark"
          className="w-full"
        />

        <div className="flex flex-col gap-2">
          {canNativeShare ? (
            <>
              <button type="button" onClick={handleSend} className={primaryClass}>
                {t('stampShareSend')}
              </button>
              <button type="button" onClick={handleCopy} className={secondaryClass}>
                {copied ? t('sendCopied') : t('stampShareCopy')}
              </button>
            </>
          ) : (
            <button type="button" onClick={handleCopy} className={primaryClass}>
              {copied ? t('sendCopied') : t('stampShareCopy')}
            </button>
          )}

          <div className="flex items-center justify-center gap-6 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-1 bg-transparent text-white/45 font-sans font-semibold text-sm hover:text-white/70 transition-colors"
            >
              {t('stampShareDismiss')}
            </button>
            <Link
              href={`/film/${filmSlug}`}
              onClick={onClose}
              className="h-11 inline-flex items-center px-1 text-white/45 font-sans font-semibold text-sm hover:text-white/70 transition-colors"
            >
              {t('stampShareViewFilm')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
