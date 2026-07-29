'use client';

import React, { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

/** Short doctrine sheet — living films / Plus Machine. */
export default function TheaterPlusInfo({
  open,
  onClose,
  isLight = false,
  /** Theater overlays the player; page uses a fixed modal over the film page. */
  variant = 'theater',
}: {
  open: boolean;
  onClose: () => void;
  isLight?: boolean;
  variant?: 'theater' | 'page';
}) {
  const t = useTranslations('Plus');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  const ink = isLight ? 'text-[#0B0B0C]' : 'text-[#F5F5F7]';
  const muted = isLight ? 'text-[#0B0B0C]/55' : 'text-[#F5F5F7]/55';
  const shell = isLight ? 'bg-[#F5F5F7]' : 'bg-[#0B0B0C]';
  const rootPos =
    variant === 'page'
      ? 'fixed inset-0 z-[100050]'
      : 'absolute inset-0 z-[60]';

  return (
    <div
      data-ui-control="true"
      className={`${rootPos} flex items-center justify-center px-5`}
      role="dialog"
      aria-modal="true"
      aria-label={t('infoTitle')}
      onClick={onClose}
    >
      <div
        className={`absolute inset-0 ${isLight ? 'bg-black/25' : 'bg-black/70'}`}
        aria-hidden
      />
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[22rem] ${shell} ${ink} rounded-2xl px-6 py-7 flex flex-col gap-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)]`}
      >
        <h2 className="font-sans text-[17px] font-bold tracking-tight">
          {t('infoTitle')}
        </h2>
        <div className={`flex flex-col gap-3 font-sans text-[14px] leading-relaxed ${muted}`}>
          <p>{t('infoP1')}</p>
          <p>{t('infoP2')}</p>
          <p>{t('infoP3')}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`mt-1 self-start font-mono text-[12px] font-medium tracking-[0.05em] uppercase bg-transparent border-0 cursor-pointer p-0 ${ink} opacity-80 hover:opacity-100`}
        >
          {t('infoClose')}
        </button>
      </div>
    </div>
  );
}
