'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { updateNominationStatus } from '@/lib/admin-actions';
import type { NominationStatus } from '@/lib/nomination-actions';

const OPTIONS: { value: NominationStatus; label: string }[] = [
  { value: 'received', label: 'Received' },
  { value: 'in_review', label: 'In review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'passed', label: 'Passed' },
  { value: 'in_production', label: 'In production' },
  { value: 'released', label: 'Released' },
];

export default function NominationStatusControl({
  id,
  status,
  statusReason,
}: {
  id: string;
  status: NominationStatus;
  statusReason: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(status);
  const [reason, setReason] = useState(statusReason || '');
  const [error, setError] = useState<string | null>(null);

  const save = (nextStatus: NominationStatus, nextReason?: string) => {
    setError(null);
    startTransition(async () => {
      const result = await updateNominationStatus({
        id,
        status: nextStatus,
        statusReason: nextReason,
      });
      if (!result.ok) {
        setError(result.error);
        setValue(status);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2 min-w-[10rem]">
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as NominationStatus;
          setValue(next);
          if (next !== 'passed') {
            setReason('');
            save(next);
          }
        }}
        className="h-9 rounded-[8px] bg-white/5 px-3 font-sans text-[13px] font-semibold text-white/85 focus:outline-none focus:bg-white/10 disabled:opacity-40"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#1F1F1F]">
            {o.label}
          </option>
        ))}
      </select>

      {value === 'passed' && (
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            disabled={pending}
            className="h-9 rounded-[8px] bg-white/5 px-3 font-sans text-[12px] text-white/80 placeholder:text-white/30 focus:outline-none focus:bg-white/10"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => save('passed', reason)}
            className="self-start h-8 px-3 rounded-full bg-white text-black font-sans text-[12px] font-bold hover:bg-white/90 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      )}

      {error && (
        <p className="font-sans text-[12px] text-red-400/90">{error}</p>
      )}
    </div>
  );
}
