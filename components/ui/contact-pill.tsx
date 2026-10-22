'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

interface ContactPillProps {
  email?: string;
  className?: string;
  /** Button label. Defaults to Nav.letsTalk. */
  label?: string;
  /** Match the About poster buttons (36px). */
  compact?: boolean;
}

export const ContactPill: React.FC<ContactPillProps> = ({
  email = 'control@fjorr.com',
  className = '',
  label,
  compact = false,
}) => {
  const t = useTranslations('Nav');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    } catch (err) {
      console.error('Hardware clipboard access transaction rejected:', err);
    }
  };

  const control = compact
    ? 'h-9 px-4 font-sans text-[14px] font-semibold tracking-tight'
    : 'h-12 px-6 py-2.5 text-[14px] font-semibold font-inter shadow-xl';

  return (
    <div className={`relative flex items-center justify-center min-w-[240px] select-none ${className}`}>
      {!copied ? (
        <button
          onClick={handleCopy}
          className={`${control} bg-[var(--page-fg)] text-[var(--page-bg)] rounded-full hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
        >
          {label || t('letsTalk')}
        </button>
      ) : (
        <div className={`relative ${compact ? 'h-9 px-4' : 'h-12 px-7'} rounded-full font-semibold text-[14px] flex items-center justify-center font-inter overflow-hidden animate-in zoom-in-95 fade-in duration-200 border border-[color-mix(in_srgb,var(--page-fg)_22%,transparent)]`}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--page-fg) 6%, transparent)',
              backgroundImage: [
                'repeating-linear-gradient(45deg, transparent, transparent 2px, color-mix(in srgb, var(--page-fg) 28%, transparent) 2px, color-mix(in srgb, var(--page-fg) 28%, transparent) 3px)',
                'repeating-linear-gradient(-45deg, transparent, transparent 2px, color-mix(in srgb, var(--page-fg) 16%, transparent) 2px, color-mix(in srgb, var(--page-fg) 16%, transparent) 3px)',
              ].join(', '),
            }}
          />
          <span className="relative z-10 tracking-wide text-page select-none">
            {t('emailCopied')}
          </span>
        </div>
      )}
    </div>
  );
};
