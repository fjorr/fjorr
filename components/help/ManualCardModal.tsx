'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import ManualMiniSite from '@/components/help/ManualMiniSite';
import type { ManualAudience } from '@/lib/help/content';

/**
 * Same Manual mini-site card — presented as an overlay from the site.
 * Portaled to body so parent transforms (e.g. slide-up) don’t shrink `fixed`.
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100060] flex items-center justify-center p-3 sm:p-8 text-left">
      <button
        type="button"
        aria-label={t('close')}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        className="relative z-[1] w-full max-w-[28rem] text-left overflow-visible"
      >
        <ManualMiniSite
          mode="modal"
          slug={initialSlug}
          audience={audience}
          onExit={onClose}
        />
      </div>
    </div>,
    document.body
  );
}
