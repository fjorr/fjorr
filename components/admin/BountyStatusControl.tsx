'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { updateBountyStatus } from '@/lib/admin-actions';

const OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'filled', label: 'Filled' },
  { value: 'closed', label: 'Closed' },
] as const;

export default function BountyStatusControl({
  id,
  status,
}: {
  id: string;
  status: 'active' | 'filled' | 'closed';
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
          const next = e.target.value as typeof status;
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
        className="h-9 rounded-[8px] bg-white/5 px-3 font-sans text-[13px] font-semibold text-white/85 focus:outline-none focus:bg-white/10 disabled:opacity-40"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#1F1F1F]">
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
