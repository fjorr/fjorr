'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { awardNomination } from '@/lib/admin-actions';

export default function NominationAwardControl({
  id,
  bountyId,
}: {
  id: string;
  bountyId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!bountyId) {
    return (
      <p className="font-sans text-[11px] text-page-faint leading-snug max-w-[10rem]">
        Attach a bounty to award.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending || done}
        onClick={() => {
          if (
            !window.confirm(
              'Award this pitch? Sets Shortlisted and marks the bounty Filled.'
            )
          ) {
            return;
          }
          setError(null);
          startTransition(async () => {
            const result = await awardNomination({ id, bountyId });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setDone(true);
            router.refresh();
          });
        }}
        className="h-9 px-4 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[12px] font-bold hover:opacity-90 disabled:opacity-40 transition-all active:scale-[0.98]"
      >
        {done ? 'Awarded' : pending ? 'Awarding…' : 'Award'}
      </button>
      {error && (
        <p className="font-sans text-[12px] text-red-400/90">{error}</p>
      )}
    </div>
  );
}
