'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export type CatalogPreviewArtifact = {
  slug: string;
  name: string;
  image: string | null;
  pageBg: string;
  isDarkBg: boolean;
};

/**
 * Artifact preview — same modal footprint as film Preview,
 * filled with the exhibit ground color + contained object image.
 */
export default function CatalogArtifactPreviewModal({
  artifact,
  onClose,
  onOpen,
}: {
  artifact: CatalogPreviewArtifact;
  onClose: () => void;
  onOpen: () => void;
}) {
  const t = useTranslations('Film');
  const [mounted, setMounted] = useState(false);
  const fg = artifact.isDarkBg ? 'text-white/90' : 'text-[#0B0B0C]/85';
  const fgMuted = artifact.isDarkBg ? 'text-white/45' : 'text-black/40';

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
        aria-label={artifact.name}
        className="relative z-[1] flex aspect-[4/5] w-full max-w-[24rem] flex-col overflow-hidden rounded-[18px] shadow-[0_28px_80px_rgba(0,0,0,0.35)] sm:aspect-[16/11] sm:max-w-[32rem] sm:rounded-[20px] lg:max-w-[38rem] xl:max-w-[42rem]"
        style={{ backgroundColor: artifact.pageBg }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex min-h-0 flex-1 items-center justify-center p-6 sm:p-8">
          {artifact.image ? (
            <Image
              src={artifact.image}
              alt={artifact.name}
              width={1600}
              height={2400}
              sizes="(max-width: 640px) 90vw, 42rem"
              className="max-h-full w-auto max-w-full object-contain"
            />
          ) : (
            <p className={`m-0 font-sans text-[14px] font-semibold ${fgMuted}`}>
              {artifact.name}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-baseline justify-between gap-4 px-5 pb-5 pt-1 sm:px-6 sm:pb-6">
          <button
            type="button"
            onClick={onOpen}
            className={`min-w-0 truncate border-0 bg-transparent p-0 text-left font-sans text-[14px] font-semibold tracking-tight transition-opacity hover:opacity-70 sm:text-[15px] ${fg}`}
          >
            {artifact.name}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 border-0 bg-transparent p-0 font-sans text-[13px] font-semibold tracking-tight transition-opacity hover:opacity-70 ${fgMuted}`}
          >
            {t('sendClose')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
