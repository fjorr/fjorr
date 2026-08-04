'use client';

import React, { useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ManualCardModal from '@/components/help/ManualCardModal';
import type { ManualAudience } from '@/lib/help/content';

/**
 * Quiet help control — opens the Manual card as an overlay (same content as /manual/[slug]).
 */
export default function ManualHelpButton({
  slug,
  audience = 'guest',
  className = '',
  label,
}: {
  slug: string;
  audience?: ManualAudience;
  className?: string;
  /** Accessible label; defaults to Help.seeManual */
  label?: string;
}) {
  const t = useTranslations('Help');
  const [open, setOpen] = useState(false);
  const aria = label || t('seeManual');

  return (
    <>
      <button
        type="button"
        aria-label={aria}
        onClick={() => setOpen(true)}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-page-muted hover:text-page hover:bg-[color-mix(in_srgb,var(--page-fg)_6%,transparent)] transition-colors ${className}`}
      >
        <CircleHelp size={18} strokeWidth={1.75} aria-hidden />
      </button>
      <ManualCardModal
        open={open}
        onClose={() => setOpen(false)}
        initialSlug={slug}
        audience={audience}
      />
    </>
  );
}
