'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

const FALLBACK_EMAIL = 'control@fjorr.com';

const hatchStyle: React.CSSProperties = {
  backgroundColor: 'color-mix(in srgb, var(--page-fg) 6%, transparent)',
  backgroundImage: [
    'repeating-linear-gradient(45deg, transparent, transparent 2px, color-mix(in srgb, var(--page-fg) 28%, transparent) 2px, color-mix(in srgb, var(--page-fg) 28%, transparent) 3px)',
    'repeating-linear-gradient(-45deg, transparent, transparent 2px, color-mix(in srgb, var(--page-fg) 16%, transparent) 2px, color-mix(in srgb, var(--page-fg) 16%, transparent) 3px)',
  ].join(', '),
};

function emailFromHref(href?: string): string {
  if (!href) return FALLBACK_EMAIL;
  if (href.startsWith('clipboard:')) {
    const raw = href.slice('clipboard:'.length).trim();
    return raw || FALLBACK_EMAIL;
  }
  if (href.startsWith('mailto:')) {
    const raw = href.slice('mailto:'.length).split('?')[0]?.trim();
    return raw || FALLBACK_EMAIL;
  }
  return FALLBACK_EMAIL;
}

/** Soft contact — copies email instead of opening mailto. */
export default function ManualCopyEmailButton({
  label,
  className,
  href,
}: {
  label: string;
  className: string;
  /** `clipboard:user@host` (or mailto:) — email payload to copy. */
  href?: string;
}) {
  const t = useTranslations('Nav');
  const [copied, setCopied] = useState(false);
  const email = emailFromHref(href);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  if (copied) {
    return (
      <div
        role="status"
        className="self-start relative inline-flex h-9 items-center px-3.5 rounded-[8px] font-sans text-[13px] font-semibold tracking-tight text-page overflow-hidden border border-[color-mix(in_srgb,var(--page-fg)_22%,transparent)] print:hidden"
      >
        <div className="absolute inset-0 pointer-events-none" style={hatchStyle} />
        <span className="relative z-10 select-none">{t('emailCopied')}</span>
      </div>
    );
  }

  return (
    <button type="button" onClick={handleCopy} className={className}>
      {label}
    </button>
  );
}
