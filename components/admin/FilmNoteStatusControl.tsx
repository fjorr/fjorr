'use client';

import React, { useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { updateFilmNoteStatus } from '@/lib/admin-actions';

const STATUSES = ['new', 'read', 'archived'] as const;

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
        const next = e.target.value as (typeof STATUSES)[number];
        startTransition(async () => {
          await updateFilmNoteStatus({ id, status: next });
          router.refresh();
        });
      }}
      className="h-8 rounded-md bg-white/5 border border-white/10 px-2 font-mono text-[11px] text-white/80"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
