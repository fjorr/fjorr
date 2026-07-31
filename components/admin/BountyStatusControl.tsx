'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { updateBountyStatus } from '@/lib/admin-actions';
import type { BountyStatus } from '@/lib/nomination-actions';

const OPTIONS: { value: BountyStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'claimed', label: 'Claimed' },
  { value: 'in_production', label: 'In production' },
  { value: 'closed', label: 'Closed' },
];

export default function BountyStatusControl({
  id,
  status,
}: {
  id: string;
  status: BountyStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as BountyStatus;
          setValue(next);
          setError(null);
          startTransition(async () => {
            const result = await updateBountyStatus({ id, status: next });
            if (!result.ok) {
              setError(result.error);
              setValue(status);
              return;
            }
            router.refresh();
          });
        }}
        className="h-9 rounded-[8px] bg-page-chip px-3 font-sans text-[13px] font-semibold text-page focus:outline-none focus:bg-page-chip-active disabled:opacity-40"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-page">
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="font-sans text-[12px] text-red-400/90">{error}</p>
      )}
    </div>
  );
}
