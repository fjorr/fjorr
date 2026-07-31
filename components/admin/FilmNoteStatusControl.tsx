'use client';

import React, { useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { updateFilmNoteStatus } from '@/lib/admin-actions';

const STATUSES = [
  { value: 'new', label: 'Queued' },
  { value: 'read', label: 'Read' },
  { value: 'archived', label: 'Patched' },
] as const;

export default function FilmNoteStatusControl({
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
        const next = e.target.value as (typeof STATUSES)[number]['value'];
        startTransition(async () => {
          await updateFilmNoteStatus({ id, status: next });
          router.refresh();
        });
      }}
      className="h-8 rounded-md bg-page-chip border border-page-faint px-2 font-mono text-[11px] text-page"
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
