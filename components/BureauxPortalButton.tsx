'use client';

import React, { useTransition } from 'react';
import { startBureauxPortal } from '@/lib/bureaux-actions';

export default function BureauxPortalButton({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  pendingLabel: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await startBureauxPortal();
        });
      }}
      className={
        className ||
        'self-start h-11 px-5 rounded-full border border-page-faint bg-transparent font-sans text-[13px] font-semibold text-page-muted hover:text-page hover:border-page-muted disabled:opacity-40 transition-colors'
      }
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
