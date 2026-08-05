'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ManualAudience } from '@/lib/help/content';

const ManualCardModal = dynamic(
  () => import('@/components/help/ManualCardModal'),
  { ssr: false },
);

type Variant = 'text' | 'icon' | 'link';

/**
 * Opens The Manual as an in-page card modal.
 * Default: BookOpen + “Manual”. Use `icon` when space is tight.
 * Use `link` for inline text that opens a Manual card (e.g. perk lists).
 */
export default function ManualHelpButton({
  slug,
  audience = 'guest',
  variant = 'text',
  className = '',
  label,
  children,
}: {
  slug: string;
  audience?: ManualAudience;
  variant?: Variant;
  className?: string;
  /** Accessible / visible label; defaults to Help.seeManual (“Manual”) */
  label?: string;
  /** For `link` variant — inline label content. */
  children?: React.ReactNode;
}) {
  const t = useTranslations('Help');
  const [open, setOpen] = useState(false);
  const text = label || t('seeManual');

  return (
    <>
      <button
        type="button"
        aria-label={variant === 'link' ? undefined : text}
        onClick={() => setOpen(true)}
        className={
          variant === 'icon'
            ? `inline-flex h-8 w-8 items-center justify-center rounded-full text-page-muted hover:text-page hover:bg-[color-mix(in_srgb,var(--page-fg)_6%,transparent)] transition-colors bg-transparent border-0 p-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--page-fg)_35%,transparent)] ${className}`
            : variant === 'link'
              ? `inline p-0 m-0 border-0 bg-transparent cursor-pointer font-inherit text-inherit underline underline-offset-[3px] decoration-from-font decoration-[color-mix(in_srgb,var(--page-fg)_55%,transparent)] hover:decoration-[color-mix(in_srgb,var(--page-fg)_85%,transparent)] transition-colors ${className}`
              : `inline-flex items-center gap-1.5 font-sans text-[13px] sm:text-[14px] font-semibold text-page-muted hover:text-page transition-colors bg-transparent border-0 p-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--page-fg)_35%,transparent)] rounded-sm ${className}`
        }
      >
        {variant === 'icon' || variant === 'text' ? (
          <BookOpen
            size={variant === 'icon' ? 18 : 15}
            strokeWidth={1.75}
            aria-hidden
            className="shrink-0"
          />
        ) : null}
        {variant === 'text' ? text : null}
        {variant === 'link' ? (children ?? text) : null}
      </button>
      {open ? (
        <ManualCardModal
          open={open}
          onClose={() => setOpen(false)}
          initialSlug={slug}
          audience={audience}
        />
      ) : null}
    </>
  );
}
