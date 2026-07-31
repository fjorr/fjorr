'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { updateBountyPoster } from '@/lib/admin-actions';

export default function BountyHeroControl({
  id,
  posterImageUrl,
  /** @deprecated use posterImageUrl */
  heroImageUrl,
}: {
  id: string;
  posterImageUrl?: string | null;
  heroImageUrl?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(posterImageUrl || heroImageUrl || '');
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-md">
      <span className="font-sans text-[10px] font-semibold uppercase tracking-wide text-white/30">
        Poster image URL
      </span>
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          disabled={pending}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://media.fjorr.com/…"
          className="flex-1 min-w-0 h-9 rounded-[8px] bg-white/5 px-3 font-mono text-[11px] text-white/80 placeholder:text-white/25 focus:outline-none focus:bg-white/10"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await updateBountyPoster({
                id,
                posterImageUrl: value,
              });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              router.refresh();
            });
          }}
          className="shrink-0 h-9 px-3 rounded-full bg-white/10 text-white font-sans text-[12px] font-semibold hover:bg-white/15 disabled:opacity-40"
        >
          Save
        </button>
      </div>
      {error && (
        <p className="font-sans text-[12px] text-red-400/90">{error}</p>
      )}
    </div>
  );
}
