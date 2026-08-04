'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import ManualMiniSite from '@/components/help/ManualMiniSite';
import type { ManualAudience } from '@/lib/help/content';

/**
 * Same Manual mini-site card — presented as an overlay from the site.
 */
export default function ManualCardModal({
  open,
  onClose,
  initialSlug,
  audience = 'guest',
}: {
  open: boolean;
  onClose: () => void;
  initialSlug: string;
  audience?: ManualAudience;
}) {
  const t = useTranslations('Help');

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100060] flex items-center justify-center p-4 sm:p-8 text-left">
      <button
        type="button"
        aria-label={t('close')}
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        className="relative z-[1] w-full max-w-[28rem] text-left"
      >
        <ManualMiniSite
          mode="modal"
          slug={initialSlug}
          audience={audience}
          onExit={onClose}
        />
      </div>
    </div>
  );
}
