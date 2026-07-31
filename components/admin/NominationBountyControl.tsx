'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import {
  attachNominationBounty,
  type AdminBounty,
} from '@/lib/admin-actions';

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `$${Math.round(cents / 100)}`;
  }
}

export default function NominationBountyControl({
  id,
  bountyId,
  bounties,
}: {
  id: string;
  bountyId: string | null;
  bounties: AdminBounty[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(bountyId || '');
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1 min-w-[10rem]">
      <span className="font-sans text-[10px] font-semibold uppercase tracking-wide text-white/30">
        Bounty
      </span>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          setError(null);
          startTransition(async () => {
            const result = await attachNominationBounty({
              id,
              bountyId: next || null,
            });
            if (!result.ok) {
              setError(result.error);
              setValue(bountyId || '');
              return;
            }
            router.refresh();
          });
        }}
        className="h-9 rounded-[8px] bg-white/5 px-3 font-sans text-[13px] font-semibold text-white/85 focus:outline-none focus:bg-white/10 disabled:opacity-40"
      >
        <option value="" className="bg-[#1F1F1F]">
          General (none)
        </option>
        {bounties.map((b) => (
          <option key={b.id} value={b.id} className="bg-[#1F1F1F]">
            {b.title} · {formatMoney(b.reward_amount, b.currency)}
            {b.status !== 'open' ? ` (${b.status})` : ''}
          </option>
        ))}
      </select>
      {error && (
        <p className="font-sans text-[12px] text-red-400/90">{error}</p>
      )}
    </div>
  );
}
