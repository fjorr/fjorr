'use client';

import React, { useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { updateCabinetMemberStatus } from '@/lib/admin-actions';

const STATUSES = ['prospect', 'member', 'paused'] as const;

export default function CabinetMemberStatusControl({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as (typeof STATUSES)[number];
        startTransition(async () => {
          await updateCabinetMemberStatus({ id, status: next });
          router.refresh();
        });
      }}
      className="h-8 rounded-md bg-page-chip border border-page-faint px-2 font-mono text-[11px] text-page"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
