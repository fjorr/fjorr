'use client';

import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ManualCardModal from '@/components/help/ManualCardModal';
import type { ManualAudience } from '@/lib/help/content';

type Variant = 'text' | 'icon';

/**
 * Opens The Manual as an in-page card modal.
 * Default: BookOpen + “Manual”. Use `icon` when space is tight.
 */
export default function ManualHelpButton({
  slug,
  audience = 'guest',
  variant = 'text',
  className = '',
  label,
}: {
  slug: string;
  audience?: ManualAudience;
  variant?: Variant;
  className?: string;
  /** Accessible / visible label; defaults to Help.seeManual (“Manual”) */
  label?: string;
}) {
  const t = useTranslations('Help');
  const [open, setOpen] = useState(false);
  const text = label || t('seeManual');

  return (
    <>
      <button
        type="button"
        aria-label={text}
        onClick={() => setOpen(true)}
        className={
          variant === 'icon'
            ? `inline-flex h-8 w-8 items-center justify-center rounded-full text-page-muted hover:text-page hover:bg-[color-mix(in_srgb,var(--page-fg)_6%,transparent)] transition-colors bg-transparent border-0 p-0 cursor-pointer ${className}`
            : `inline-flex items-center gap-1.5 font-sans text-[13px] sm:text-[14px] font-semibold text-page-muted hover:text-page transition-colors bg-transparent border-0 p-0 cursor-pointer ${className}`
        }
      >
        <BookOpen
          size={variant === 'icon' ? 18 : 15}
          strokeWidth={1.75}
          aria-hidden
          className="shrink-0"
        />
        {variant === 'text' ? text : null}
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
