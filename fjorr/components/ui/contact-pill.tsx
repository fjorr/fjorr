'use client';

import React, { useState } from 'react';

interface ContactPillProps {
  email?: string;
  className?: string;
}

export const ContactPill: React.FC<ContactPillProps> = ({ 
  email = 'control@fjorr.com', 
  className = '' 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      
      // Hold feedback frame for 3.5 seconds before resetting state loop
      setTimeout(() => setCopied(false), 3500);
    } catch (err) {
      console.error('Hardware clipboard access transaction rejected:', err);
    }
  };

  return (
    // Removed the rigid h-12 restriction from the container so it allows the expanded success state to breathe
    <div className={`relative flex items-center justify-center min-w-[240px] select-none ${className}`}>
      {!copied ? (
        <button
          onClick={handleCopy}
          // The base button stays locked at its native layout height scale
          className="h-12 px-6 py-2.5 bg-[var(--page-fg)] text-[var(--page-bg)] font-semibold text-[14px] rounded-full hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-xl font-inter"
        >
          Let&apos;s talk
        </button>
      ) : (
        <div className="relative h-12 px-7 rounded-full font-semibold text-[14px] flex items-center justify-center font-inter overflow-hidden animate-in zoom-in-95 fade-in duration-200 border border-[color-mix(in_srgb,var(--page-fg)_22%,transparent)]">
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
            Email copied. Fire away.
          </span>
        </div>
      )}
    </div>
  );
};