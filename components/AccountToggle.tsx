'use client';

import React from 'react';

/** Quiet on/off switch for account privacy settings — control left, copy right. */
export default function AccountToggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <div className="grid grid-cols-[2.75rem_1fr] gap-x-4 items-start text-left">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-11 shrink-0 rounded-full transition-colors justify-self-start ${
          checked ? 'bg-[var(--page-fg)]' : 'bg-page-chip'
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full shadow-sm transition-transform ${
            checked
              ? 'translate-x-4 bg-[var(--page-bg)]'
              : 'translate-x-0 bg-[var(--page-fg)]'
          }`}
        />
      </button>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-sans text-[15px] font-semibold text-page leading-snug">
          {label}
        </span>
        <span className="font-sans text-[14px] text-page-muted leading-relaxed">
          {hint}
        </span>
      </div>
    </div>
  );
}
