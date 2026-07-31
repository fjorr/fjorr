'use client';

import React from 'react';

/** Quiet on/off switch for account privacy settings. */
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
    <div className="flex items-start justify-between gap-4 text-left">
      <div className="flex flex-col gap-0.5 min-w-0 pr-2">
        <span className="font-sans text-[14px] font-semibold text-white/85">
          {label}
        </span>
        <span className="font-sans text-[12px] text-white/40 leading-snug">
          {hint}
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-white' : 'bg-white/15'
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full shadow-sm transition-transform ${
            checked
              ? 'translate-x-5 bg-[#1F1F1F]'
              : 'translate-x-0 bg-white/80'
          }`}
        />
      </button>
    </div>
  );
}
